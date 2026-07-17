import { createServerFn } from "@tanstack/react-start";

const AI_BOT_AGENTS = [
  "gptbot", "claudebot", "perplexitybot", "google-extended",
  "oai-searchbot", "anthropic-ai", "chatgpt-user", "bytespider", "ccbot",
];

const RECOGNIZED_SCHEMA_TYPES = [
  "Organization", "WebSite", "WebPage", "Article", "Product", "FAQPage",
  "BreadcrumbList", "LocalBusiness", "Person", "Event", "HowTo", "Recipe",
  "VideoObject", "SoftwareApplication",
];

const MAX_CRAWL_LIMIT = 30;
const MAX_HTML_BYTES = 512_000;
const FETCH_TIMEOUT_MS = 12_000;
const CRAWL_CONCURRENCY = 5;
const UA = "Mozilla/5.0 (compatible; AEOAuditBot/1.0; +https://github.com/onvoyage-ai/gtm-engineer-skills)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const collapse = (s: string) => (s || "").replace(/\s+/g, " ").trim();
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const scoreToInt = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
const average = (vals: number[]) => (vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length);

function decodeEntities(s: string): string {
  if (!s) return s;
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X"
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? safeCodePoint(code, m) : m;
    }
    const named: Record<string, string> = {
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
      mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
      ldquo: "“", rdquo: "”", copy: "©", reg: "®", trade: "™",
    };
    return named[e] !== undefined ? named[e] : m;
  });
}

function safeCodePoint(code: number, fallback: string): string {
  try { return String.fromCodePoint(code); } catch { return fallback; }
}

function parseAttrs(tagInner: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let m;
  while ((m = re.exec(tagInner))) {
    const name = m[1].toLowerCase();
    let val = m[2] ?? "";
    if (val && (val[0] === '"' || val[0] === "'")) val = val.slice(1, -1);
    attrs[name] = decodeEntities(val);
  }
  return attrs;
}

function findOpenTags(html: string, tagName: string): Record<string, string>[] {
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(parseAttrs(m[1]));
  return out;
}

function firstInner(html: string, tagName: string): string {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}

function allInner(html: string, tagName: string): string[] {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

const stripTags = (s: string) => (s || "").replace(/<[^>]+>/g, " ");

function visibleText(html: string): string {
  let s = (html || "").replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of ["script", "style", "noscript"]) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  return collapse(decodeEntities(stripTags(s)));
}

function contentExcerpt(bodyInner: string): string {
  let s = (bodyInner || "").replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of ["script", "style", "noscript", "nav", "header", "footer", "iframe", "svg", "form"]) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  const main = firstInner(s, "main") || firstInner(s, "article");
  return collapse(decodeEntities(stripTags(main || s))).slice(0, 2000);
}

function normalizeUrl(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const u = new URL(withProtocol);
  u.hash = "";
  u.search = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

function shouldSkipPath(pathname: string): boolean {
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|zip|rar|7z|mp4|mp3|mov|avi|woff2?|ttf|eot|css|js)$/i.test(pathname);
}

function escapeRegex(input: string): string {
  return input.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function ruleMatches(pathname: string, rule: string): boolean {
  const trimmed = (rule || "").trim();
  if (!trimmed) return false;
  const pattern = escapeRegex(trimmed).replace(/\\\*/g, ".*");
  return new RegExp(`^${pattern}`).test(pathname);
}

function isPathAllowed(pathname: string, policy: { allow: string[]; disallow: string[] }): boolean {
  let bestAllow = -1;
  let bestDisallow = -1;
  for (const rule of policy.allow) {
    if (ruleMatches(pathname, rule)) bestAllow = Math.max(bestAllow, rule.length);
  }
  for (const rule of policy.disallow) {
    if (ruleMatches(pathname, rule)) bestDisallow = Math.max(bestDisallow, rule.length);
  }
  if (bestAllow === -1 && bestDisallow === -1) return true;
  return bestAllow >= bestDisallow;
}

async function fetchText(url: string, attempts = 2): Promise<string> {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return text.length > MAX_HTML_BYTES ? text.slice(0, MAX_HTML_BYTES) : text;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error("request failed");
      if (i < attempts - 1) await sleep(350 * (i + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastErr ?? new Error("request failed");
}

async function fetchRobotsPolicy(startUrl: URL) {
  const robotsUrl = `${startUrl.protocol}//${startUrl.host}/robots.txt`;
  const fallback = { allow: [] as string[], disallow: [] as string[], sitemapUrls: [] as string[], found: false, aiBotBlocked: [] as string[] };
  try {
    const txt = await fetchText(robotsUrl);
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    const sitemaps = new Set<string>();
    const starAllow: string[] = [];
    const starDisallow: string[] = [];
    const agentRules = new Map<string, { allow: string[]; disallow: string[] }>();
    let currentAgent = "";

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s*#.*$/, "").trim();
      if (!line || !line.includes(":")) continue;
      const idx = line.indexOf(":");
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();

      if (key === "user-agent") {
        currentAgent = value.toLowerCase();
        if (AI_BOT_AGENTS.includes(currentAgent) && !agentRules.has(currentAgent)) {
          agentRules.set(currentAgent, { allow: [], disallow: [] });
        }
        continue;
      }
      if (key === "sitemap" && value) {
        try {
          const sm = new URL(value, robotsUrl);
          if (sm.host === startUrl.host) sitemaps.add(sm.toString());
        } catch { /* ignore malformed */ }
        continue;
      }
      if (AI_BOT_AGENTS.includes(currentAgent)) {
        const rules = agentRules.get(currentAgent);
        if (rules) {
          if (key === "allow" && value) rules.allow.push(value);
          if (key === "disallow" && value) rules.disallow.push(value);
        }
      }
      if (currentAgent !== "*") continue;
      if (key === "allow") starAllow.push(value);
      if (key === "disallow") starDisallow.push(value);
    }

    const aiBotBlocked: string[] = [];
    for (const [agent, rules] of agentRules) {
      const blocksAll = rules.disallow.some((r) => r.trim() === "/");
      const allowsAll = rules.allow.some((r) => r.trim() === "/");
      if (blocksAll && !allowsAll) aiBotBlocked.push(agent);
    }

    return {
      allow: starAllow.filter(Boolean),
      disallow: starDisallow.filter(Boolean),
      sitemapUrls: [...sitemaps],
      found: true,
      aiBotBlocked,
    };
  } catch {
    return fallback;
  }
}

function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  for (const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
    const v = m[1]?.trim();
    if (v) locs.push(v);
  }
  return locs;
}

async function fetchSitemapUrls(startUrl: URL, policy: { sitemapUrls: string[]; allow: string[]; disallow: string[] }, limit: number): Promise<string[]> {
  const queue = [...policy.sitemapUrls];
  if (queue.length === 0) {
    queue.push(`${startUrl.protocol}//${startUrl.host}/sitemap.xml`);
    queue.push(`${startUrl.protocol}//${startUrl.host}/sitemap_index.xml`);
  }
  const seen = new Set<string>();
  const out = new Set<string>();

  while (queue.length > 0 && out.size < limit) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    try {
      const xml = await fetchText(sitemapUrl);
      const isIndex = /<sitemapindex[\s>]/i.test(xml);
      for (const loc of extractSitemapLocs(xml)) {
        try {
          const u = new URL(loc, sitemapUrl);
          if (u.host !== startUrl.host) continue;
          u.hash = "";
          u.search = "";
          if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
          if (shouldSkipPath(u.pathname)) continue;
          if (!isPathAllowed(u.pathname || "/", policy)) continue;
          if (isIndex) queue.push(u.toString());
          else out.add(u.toString());
          if (out.size >= limit) break;
        } catch { /* ignore malformed */ }
      }
    } catch { /* ignore inaccessible sitemap */ }
  }
  return [...out];
}

async function detectRssFeed(startPageHtml: string, startUrl: URL): Promise<boolean> {
  for (const link of findOpenTags(startPageHtml, "link")) {
    const rel = (link.rel || "").toLowerCase();
    const type = (link.type || "").toLowerCase();
    if (rel.includes("alternate") && /(rss|atom)\+xml/.test(type)) return true;
  }
  const base = `${startUrl.protocol}//${startUrl.host}`;
  for (const path of ["/feed", "/rss.xml", "/atom.xml", "/feed.xml"]) {
    try {
      const content = await fetchText(`${base}${path}`, 1);
      if (/<rss[\s>]|<feed[\s>]|<channel[\s>]/i.test(content)) return true;
    } catch { /* try next */ }
  }
  return false;
}

async function validateLlmsTxt(startUrl: URL) {
  const base = `${startUrl.protocol}//${startUrl.host}`;
  const result = { found: false, hasH1: false, hasLink: false, contentLength: 0, fullTxtFound: false };
  try {
    const content = await fetchText(`${base}/llms.txt`, 1);
    result.found = true;
    result.contentLength = content.trim().length;
    result.hasH1 = /^#\s+.+/m.test(content);
    result.hasLink = /\[.+?\]\(.+?\)/.test(content);
  } catch {
    return result;
  }
  try {
    await fetchText(`${base}/llms-full.txt`, 1);
    result.fullTxtFound = true;
  } catch { /* optional file */ }
  return result;
}

const isLlmsTxtValid = (r: { found: boolean; hasH1: boolean; hasLink: boolean; contentLength: number }) =>
  r.found && r.hasH1 && r.hasLink && r.contentLength > 100;

function extractInternalLinks(html: string, pageUrl: URL, startHost: string, policy: { allow: string[]; disallow: string[] }): string[] {
  const out = new Set<string>();
  for (const a of findOpenTags(html, "a")) {
    const href = a.href || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, pageUrl);
      if (!["http:", "https:"].includes(u.protocol)) continue;
      if (u.host !== startHost) continue;
      u.hash = "";
      u.search = "";
      if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
      if (shouldSkipPath(u.pathname)) continue;
      if (!isPathAllowed(u.pathname || "/", policy)) continue;
      out.add(u.toString());
    } catch { /* ignore malformed */ }
  }
  return [...out].slice(0, 40);
}

interface AiView {
  title: string;
  metaDescription: string;
  h1: string[];
  h1Count: number;
  headings: string[];
  jsonLdCount: number;
  schemaTypes: string[];
  jsonLdSummary: string;
  internalLinkCount: number;
  textExcerpt: string;
  bodyWordCount: number;
  publishedDate: string;
  modifiedDate: string;
  author: string;
  aiMetaTags: string[];
  hasNoindex: boolean;
  canonical: string;
  hasOg: boolean;
  imgCount: number;
  imgsWithAlt: number;
  headingLevels: number[];
}

function extractAiView(html: string, pageUrl: URL): AiView {
  const title = collapse(stripTags(firstInner(html, "title")));

  const metaTags = findOpenTags(html, "meta");
  const metaByName: Record<string, string> = {};
  const metaByProp: Record<string, string> = {};
  for (const m of metaTags) {
    if (m.name) metaByName[m.name.toLowerCase()] = m.content || "";
    if (m.property) metaByProp[m.property.toLowerCase()] = m.content || "";
  }
  const metaDescription = (metaByName.description || "").trim();

  const h1 = allInner(html, "h1").map((t) => collapse(stripTags(t))).filter(Boolean).slice(0, 8);
  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;

  const headings: string[] = [];
  for (const m of html.matchAll(/<(h[23])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = collapse(stripTags(m[2]));
    if (t) headings.push(t);
  }

  // JSON-LD
  const jsonLdBlocks: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    jsonLdBlocks.push(m[1]);
  }
  const schemaTypes: string[] = [];
  const jsonLdParts: string[] = [];
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block.trim());
      const items = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      for (const item of items) {
        if (!item || !item["@type"]) continue;
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        schemaTypes.push(...types);
        const fields = [`@type=${types.join(",")}`];
        if (item.name) fields.push(`name=${String(item.name).slice(0, 80)}`);
        if (item.author) {
          const an = typeof item.author === "string" ? item.author : item.author?.name;
          if (an) fields.push(`author=${String(an).slice(0, 60)}`);
        }
        if (item.datePublished) fields.push(`datePublished=${String(item.datePublished).slice(0, 20)}`);
        if (item.dateModified) fields.push(`dateModified=${String(item.dateModified).slice(0, 20)}`);
        if (item.publisher?.name) fields.push(`publisher=${String(item.publisher.name).slice(0, 60)}`);
        if (item.description) fields.push(`description=${String(item.description).slice(0, 100)}`);
        jsonLdParts.push(fields.join(" | "));
      }
    } catch { /* ignore malformed JSON-LD */ }
  }

  // Internal link count
  let internalLinkCount = 0;
  for (const a of findOpenTags(html, "a")) {
    const href = a.href || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      if (new URL(href, pageUrl).host === pageUrl.host) internalLinkCount += 1;
    } catch { /* ignore */ }
  }

  // Body text
  const bodyInner = firstInner(html, "body") || html;
  const bodyWordCount = visibleText(bodyInner).split(/\s+/).filter(Boolean).length;
  const textExcerpt = contentExcerpt(bodyInner);

  // Date / author signals
  const timeMatch = html.match(/<time\b[^>]*\bdatetime\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
  const timeDatetime = timeMatch ? timeMatch[1].replace(/^["']|["']$/g, "") : "";
  const publishedDate =
    metaByProp["article:published_time"] || metaByName.date ||
    metaByName["dc.date"] || timeDatetime || "";
  const modifiedDate =
    metaByProp["article:modified_time"] || metaByName["last-modified"] || "";
  const author = metaByName.author || metaByProp["article:author"] || "";

  // Restrictive AI meta tags
  const aiMetaTags = new Set<string>();
  for (const m of metaTags) {
    const name = (m.name || "").toLowerCase();
    if (name !== "robots" && name !== "googlebot") continue;
    const content = (m.content || "").toLowerCase();
    if (content.includes("nosnippet")) aiMetaTags.add("nosnippet");
    if (content.includes("noai")) aiMetaTags.add("noai");
    if (content.includes("noimageai")) aiMetaTags.add("noimageai");
  }

  const hasNoindex = metaTags.some(
    (m) => (m.name || "").toLowerCase() === "robots" &&
      (m.content || "").toLowerCase().includes("noindex")
  );

  let canonical = "";
  for (const link of findOpenTags(html, "link")) {
    if ((link.rel || "").toLowerCase() === "canonical" && link.href) {
      canonical = link.href.trim();
      break;
    }
  }

  const hasOg = !!metaByProp["og:title"] && !!metaByProp["og:description"];

  const imgs = findOpenTags(html, "img");
  const imgsWithAlt = imgs.filter((i) => (i.alt || "").trim().length > 0).length;

  const headingLevels: number[] = [];
  for (const m of html.matchAll(/<(h[1-6])\b[^>]*>/gi)) {
    headingLevels.push(parseInt(m[1].slice(1), 10));
  }

  return {
    title, metaDescription, h1, h1Count, headings: headings.slice(0, 16),
    jsonLdCount: jsonLdBlocks.length,
    schemaTypes: [...new Set(schemaTypes)],
    jsonLdSummary: jsonLdParts.slice(0, 5).join("\n"),
    internalLinkCount, textExcerpt, bodyWordCount,
    publishedDate, modifiedDate, author,
    aiMetaTags: [...aiMetaTags], hasNoindex, canonical, hasOg,
    imgCount: imgs.length, imgsWithAlt, headingLevels,
  };
}

function classifyPageType(urlString: string): string {
  const path = new URL(urlString).pathname.toLowerCase();
  if (path === "/" || path === "") return "home";
  if (/(^|\/)pricing(\/|$)/.test(path)) return "pricing";
  if (/(^|\/)(product|products|features)(\/|$)/.test(path)) return "product";
  if (/(^|\/)(docs|documentation|guide|api)(\/|$)/.test(path)) return "docs";
  if (/(^|\/)(blog|news|article|articles)(\/|$)/.test(path)) return "blog";
  if (/(^|\/)(about|company|team)(\/|$)/.test(path)) return "about";
  if (/(^|\/)(contact|support)(\/|$)/.test(path)) return "contact";
  return "other";
}

interface PageCheck {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  details: string;
}

function scorePageChecks(v: AiView): { checks: PageCheck[]; score: number; maxScore: number } {
  const checks: PageCheck[] = [];
  const foundTypes = v.schemaTypes.filter((t) => RECOGNIZED_SCHEMA_TYPES.includes(t));

  let headingSkipped = false;
  for (let i = 1; i < v.headingLevels.length; i += 1) {
    if (v.headingLevels[i] - v.headingLevels[i - 1] > 1) { headingSkipped = true; break; }
  }
  const uniqueLevels = new Set(v.headingLevels).size;
  const altRatio = v.imgCount === 0 ? 1 : v.imgsWithAlt / v.imgCount;

  checks.push({ id: "title", label: "Clear page title", passed: v.title.length >= 10, points: 10,
    details: v.title ? `Found title (${v.title.length} chars).` : "No <title> found." });
  checks.push({ id: "meta-description", label: "Meta description", passed: v.metaDescription.length >= 50, points: 10,
    details: v.metaDescription ? `Found description (${v.metaDescription.length} chars).` : "No meta description found." });
  checks.push({ id: "canonical", label: "Canonical URL", passed: v.canonical.length > 0, points: 8,
    details: v.canonical ? `Canonical: ${v.canonical}` : "No canonical tag found." });
  checks.push({ id: "h1", label: "Single H1 heading", passed: v.h1Count === 1, points: 8,
    details: `Found ${v.h1Count} h1 tag(s).` });
  checks.push({ id: "schema", label: "Structured data present", passed: v.jsonLdCount > 0, points: 8,
    details: v.jsonLdCount > 0 ? `Found ${v.jsonLdCount} JSON-LD block(s).` : "No JSON-LD structured data found." });
  checks.push({ id: "schema-types", label: "Schema types identified", passed: foundTypes.length > 0, points: 8,
    details: foundTypes.length > 0 ? `Types: ${foundTypes.join(", ")}` : "No recognized @type found in JSON-LD." });
  checks.push({ id: "og", label: "Open Graph basics", passed: v.hasOg, points: 8,
    details: v.hasOg ? "og:title and og:description found." : "Missing og:title and/or og:description." });
  checks.push({ id: "internal-links", label: "Internal linking", passed: v.internalLinkCount >= 5, points: 10,
    details: `Found ${v.internalLinkCount} internal links.` });
  checks.push({ id: "image-alt", label: "Image alt coverage", passed: altRatio >= 0.8, points: 8,
    details: v.imgCount === 0 ? "No images on page." : `${v.imgsWithAlt}/${v.imgCount} images include alt text.` });
  checks.push({ id: "text-depth", label: "Readable content depth", passed: v.bodyWordCount >= 250, points: 12,
    details: `Estimated ${v.bodyWordCount} words in body text.` });
  checks.push({ id: "indexability", label: "Indexable for discovery", passed: !v.hasNoindex, points: 10,
    details: v.hasNoindex ? "Page has noindex directive." : "No noindex directive found." });
  checks.push({ id: "ai-meta-tags", label: "AI-accessible meta tags", passed: v.aiMetaTags.length === 0, points: 6,
    details: v.aiMetaTags.length === 0 ? "No restrictive AI meta tags." : `Restrictive tags: ${v.aiMetaTags.join(", ")}` });
  checks.push({ id: "heading-hierarchy", label: "Content structure",
    passed: !headingSkipped && v.headingLevels.length > 0 && uniqueLevels >= 2, points: 6,
    details: v.headingLevels.length === 0
      ? "No headings found — AI agents have no structural anchors to chunk content."
      : uniqueLevels < 2
        ? "Only one heading level used — content lacks topic segmentation for AI chunking."
        : headingSkipped
          ? "Heading levels skipped — weakens the content outline AI agents use for extraction."
          : `Clean heading structure (${uniqueLevels} levels) — easy for AI agents to chunk and cite.` });

  const score = checks.reduce((s, c) => s + (c.passed ? c.points : 0), 0);
  const maxScore = checks.reduce((s, c) => s + c.points, 0);
  return { checks, score, maxScore };
}

function makeSummary(pct: number): string {
  if (pct >= 80) return "Strong for AI agents. Improve a few weak signals to harden performance.";
  if (pct >= 60) return "Decent base, but key machine-readable signals are missing.";
  if (pct >= 40) return "Needs work. AI agents may miss context or trust signals.";
  return "High risk for AI interpretation. Prioritize technical and content structure fixes.";
}

interface PageAuditResult {
  url: string;
  score: number;
  maxScore: number;
  summary: string;
  checks: PageCheck[];
  aiView: AiView;
  pageType: string;
}

async function crawlSite(startUrl: string, maxPages: number) {
  const start = new URL(startUrl);
  const robotsPolicy = await fetchRobotsPolicy(start);
  const sitemapUrls = await fetchSitemapUrls(start, robotsPolicy, Math.min(maxPages * 8, 400));

  const queue = [startUrl, ...sitemapUrls.filter((u) => u !== startUrl)];
  const seen = new Set(queue);
  const pages: PageAuditResult[] = [];
  let robotsBlockedCount = 0;
  let failedPages = 0;
  let startPageHtml = "";

  // Initialize shared browser for this crawl session
  let browser: any = null;
  let context: any = null;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream"
      ]
    });
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
  } catch (err) {
    console.warn("[AEO] Playwright not available, falling back to standard HTTP fetch:", err);
  }

  async function fetchPageHtml(url: string): Promise<string> {
    if (context) {
      let page: any = null;
      try {
        page = await context.newPage();
        await page.addInitScript(() => {
          Object.defineProperty(navigator, "webdriver", { get: () => undefined });
        });
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        const html = await page.content();
        return html;
      } catch (err: any) {
        console.warn(`[AEO] Playwright page load failed for ${url}, trying standard fetch:`, err?.message || err);
      } finally {
        if (page) await page.close().catch(() => {});
      }
    }
    return await fetchText(url);
  }

  async function processUrl(currentUrl: string, isFirst: boolean) {
    try {
      const url = new URL(currentUrl);
      if (!isPathAllowed(url.pathname || "/", robotsPolicy)) {
        robotsBlockedCount += 1;
        return;
      }
      const html = await fetchPageHtml(currentUrl);
      if (isFirst) startPageHtml = html;
      const aiView = extractAiView(html, url);
      const { checks, score, maxScore } = scorePageChecks(aiView);
      pages.push({
        url: currentUrl, score, maxScore,
        summary: makeSummary(Math.round((score / maxScore) * 100)),
        checks, aiView, pageType: classifyPageType(currentUrl),
      });
      for (const link of extractInternalLinks(html, url, start.host, robotsPolicy)) {
        if (pages.length + queue.length >= maxPages * 4) break;
        if (seen.has(link)) continue;
        seen.add(link);
        queue.push(link);
      }
    } catch (err: any) {
      console.warn(`[AEO] Failed to process URL ${currentUrl}:`, err?.message || err);
      failedPages += 1;
    }
  }

  const firstUrl = queue.shift();
  if (firstUrl) await processUrl(firstUrl, true);

  while (queue.length > 0 && pages.length < maxPages) {
    const batch = [];
    while (batch.length < CRAWL_CONCURRENCY && queue.length > 0 && pages.length + batch.length < maxPages) {
      const next = queue.shift();
      if (next) batch.push(next);
    }
    if (batch.length === 0) break;
    await Promise.all(batch.map((u) => processUrl(u, false)));
  }

  // Clean up browser instance
  if (browser) {
    await browser.close().catch(() => {});
  }

  return {
    pageAudits: pages,
    robotsFound: robotsPolicy.found,
    robotsBlockedCount,
    discoveredFromSitemap: Math.min(sitemapUrls.length, maxPages),
    failedPages,
    robotsPolicy,
    startPageHtml,
  };
}

export function aggregateChecks(pageAudits: PageAuditResult[]) {
  const byId = new Map<string, { label: string; points: number; passCount: number; total: number }>();
  for (const page of pageAudits) {
    for (const check of page.checks) {
      const row = byId.get(check.id) ?? { label: check.label, points: check.points, passCount: 0, total: 0 };
      row.total += 1;
      if (check.passed) row.passCount += 1;
      byId.set(check.id, row);
    }
  }
  return [...byId.entries()].map(([id, row]) => ({
    id, label: row.label, points: row.points,
    passed: row.total > 0 && row.passCount / row.total >= 0.8,
    details: `${row.passCount}/${row.total} pages passed this check.`,
  }));
}

export function buildCoverage(pageAudits: PageAuditResult[]) {
  const map = new Map<string, { pages: number; scoreSum: number }>();
  for (const page of pageAudits) {
    const row = map.get(page.pageType) ?? { pages: 0, scoreSum: 0 };
    row.pages += 1;
    row.scoreSum += Math.round((page.score / page.maxScore) * 100);
    map.set(page.pageType, row);
  }
  return [...map.entries()]
    .map(([pageType, row]) => ({ pageType, pages: row.pages, avgScore: Math.round(row.scoreSum / row.pages) }))
    .sort((a, b) => b.pages - a.pages);
}

export function buildPrioritizedFixes(
  checks: { id: string; label: string; passed: boolean; points: number; details: string }[],
  coverage: { pageType: string; pages: number; avgScore: number }[],
  llmsValid: boolean,
  blockedBots: string[]
) {
  const fixes = [];
  const byId = new Map(checks.map((c) => [c.id, c]));
  const failed = (id: string) => !byId.get(id)?.passed;

  if (blockedBots.length > 0) fixes.push({ title: "Unblock major AI crawlers in robots.txt", impact: "High", effort: "Low",
    why: `You're blocking ${blockedBots.join(", ")} — these bots can't index your content.` });
  if (failed("ai-meta-tags")) fixes.push({ title: "Remove restrictive AI meta tags", impact: "High", effort: "Low",
    why: "Tags like nosnippet and noai prevent AI systems from using your content." });
  if (failed("schema")) fixes.push({ title: "Add structured data (JSON-LD) on key templates", impact: "High", effort: "Medium",
    why: "Agents rely on machine-readable entities and page intent signals." });
  if (failed("meta-description") || failed("title")) fixes.push({ title: "Standardize title and meta description quality", impact: "High", effort: "Low",
    why: "Weak metadata reduces retrieval accuracy and snippet quality." });
  if (failed("text-depth")) fixes.push({ title: "Expand answer-first content on thin pages", impact: "High", effort: "Medium",
    why: "Agents need enough explicit facts and context to answer safely." });
  if (failed("internal-links")) fixes.push({ title: "Improve internal linking between key pages", impact: "Medium", effort: "Low",
    why: "Better graph connectivity improves crawl and context propagation." });
  if (!llmsValid) fixes.push({ title: "Publish a valid llms.txt with heading, links, and policy info", impact: "Medium", effort: "Low",
    why: "It gives AI systems a direct index of trusted URLs and constraints." });
  if (failed("rss-feed")) fixes.push({ title: "Add an RSS or Atom feed", impact: "Medium", effort: "Low",
    why: "RSS feeds help AI systems discover and track new content." });
  if (failed("heading-hierarchy")) fixes.push({ title: "Improve content structure with clear heading levels", impact: "Medium", effort: "Low",
    why: "Well-structured H1 → H2 → H3 outlines help AI agents chunk, extract, and cite specific sections." });
  if (failed("schema-types")) fixes.push({ title: "Add recognized schema types to JSON-LD", impact: "Medium", effort: "Medium",
    why: "Named types like Organization, Product, Article help AI classify your content." });
  if (!coverage.some((c) => c.pageType === "docs")) fixes.push({ title: "Create a docs/knowledge section for product facts", impact: "Medium", effort: "Medium",
    why: "A stable docs corpus helps agents extract precise answers." });

  return fixes.slice(0, 8);
}

function tokenize(text: string): string[] {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length >= 4);
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  let inter = 0;
  for (const t of aSet) if (bSet.has(t)) inter += 1;
  return inter / Math.max(1, Math.min(aSet.size, bSet.size));
}

function intentAlignment(page: PageAuditResult): number {
  const titleTokens = tokenize(page.aiView.title);
  return average([
    overlap(titleTokens, tokenize(page.aiView.metaDescription)),
    overlap(titleTokens, tokenize(page.aiView.h1[0] || "")),
  ]);
}

function checkPassRatio(pageAudits: PageAuditResult[], id: string): number {
  if (pageAudits.length === 0) return 0;
  return pageAudits.filter((p) => p.checks.find((c) => c.id === id)?.passed).length / pageAudits.length;
}

const scoreStatus = (s: number) => (s >= 80 ? "Strong" : s >= 60 ? "Moderate" : "Weak");
const priorityFromScore = (s: number) => (s < 45 ? "Critical" : s < 65 ? "High ROI" : s < 82 ? "Quick Win" : "Monitor");

export function buildIntelligenceSignals(ctx: {
  pageAudits: PageAuditResult[];
  coverage: { pageType: string; pages: number; avgScore: number }[];
  blockedBots: string[];
  rssFeedFound: boolean;
  discoveredFromSitemap: number;
  failedPages: number;
  maxPages: number;
}) {
  const { pageAudits, coverage, blockedBots, rssFeedFound, discoveredFromSitemap, failedPages, maxPages } = ctx;
  const total = Math.max(1, pageAudits.length);
  const titleRatio = pageAudits.filter((p) => p.aiView.title.length >= 20).length / total;
  const metaRatio = pageAudits.filter((p) => p.aiView.metaDescription.length >= 80).length / total;
  const singleH1Ratio = pageAudits.filter((p) => p.aiView.h1Count === 1).length / total;
  const textDepthRatio = checkPassRatio(pageAudits, "text-depth");
  const headingHierarchyRatio = checkPassRatio(pageAudits, "heading-hierarchy");
  const indexableRatio = checkPassRatio(pageAudits, "indexability");
  const alignmentRatio = average(pageAudits.map(intentAlignment));
  const avgInternalLinks = average(pageAudits.map((p) => p.aiView.internalLinkCount));
  const internalLinksNorm = clamp01(avgInternalLinks / 12);
  const templateDiversity = clamp01(coverage.length / 5);
  const sitemapDiscovery = clamp01(discoveredFromSitemap / Math.max(1, maxPages));
  const crawlSuccess = clamp01(1 - failedPages / Math.max(1, failedPages + pageAudits.length));
  const numericEvidenceRatio = pageAudits.filter((p) => /\d/.test(p.aiView.textExcerpt)).length / total;
  const headingRichRatio = pageAudits.filter((p) => p.aiView.headings.length >= 4).length / total;
  const faqHeadingRatio = pageAudits.filter((p) => p.aiView.headings.some((h) => /\?|FAQ|how to|what is|guide/i.test(h))).length / total;
  const answerFirstRatio = pageAudits.filter((p) =>
    /\bis\b|\bare\b|\bwas\b|\bmeans\b|\brefers to\b|\bdefined as\b/i.test((p.aiView.textExcerpt || "").slice(0, 200))
  ).length / total;
  const hasDateSignals = pageAudits.filter((p) => p.aiView.publishedDate || p.aiView.modifiedDate).length / total;
  const hasAuthorRatio = pageAudits.filter((p) => !!p.aiView.author).length / total;

  const base = [
    { id: "answer-readiness", signal: "Answer Readiness",
      score: scoreToInt(30 * faqHeadingRatio + 30 * answerFirstRatio + 20 * metaRatio + 20 * textDepthRatio),
      rationale: "Does the content lead with direct answers to questions agents get asked?",
      keyFinding: `${Math.round(faqHeadingRatio * 100)}% pages have Q&A-style headings; ${Math.round(answerFirstRatio * 100)}% lead with definitions.` },
    { id: "quotability", signal: "Quotability",
      score: scoreToInt(30 * headingRichRatio + 25 * textDepthRatio + 25 * headingHierarchyRatio + 20 * alignmentRatio),
      rationale: "Can an agent extract clean, self-contained passages to quote as citations?",
      keyFinding: `${Math.round(headingRichRatio * 100)}% pages have rich headings; ${Math.round(textDepthRatio * 100)}% meet depth threshold.` },
    { id: "evidence-density", signal: "Evidence Density",
      score: scoreToInt(35 * numericEvidenceRatio + 25 * hasAuthorRatio + 20 * textDepthRatio + 20 * internalLinksNorm),
      rationale: "Density of statistics, data points, named sources, and in-text citations.",
      keyFinding: `${Math.round(numericEvidenceRatio * 100)}% pages include numeric evidence; ${Math.round(hasAuthorRatio * 100)}% have author attribution.` },
    { id: "content-depth", signal: "Content Depth",
      score: scoreToInt(35 * textDepthRatio + 25 * templateDiversity + 25 * internalLinksNorm + 15 * headingRichRatio),
      rationale: "Substantive long-form content that covers topics with depth and breadth.",
      keyFinding: `${Math.round(textDepthRatio * 100)}% pages meet depth threshold across ${coverage.length} template types.` },
    { id: "freshness", signal: "Freshness",
      score: scoreToInt(30 * hasDateSignals + 25 * (rssFeedFound ? 1 : 0) + 20 * sitemapDiscovery + 15 * crawlSuccess + 10 * indexableRatio),
      rationale: "Date signals, update timestamps, and active maintenance indicators.",
      keyFinding: `${Math.round(hasDateSignals * 100)}% pages have date signals; ${rssFeedFound ? "RSS feed found" : "no RSS feed"}.` },
    { id: "structural-clarity", signal: "Structural Clarity",
      score: scoreToInt(30 * headingHierarchyRatio + 25 * titleRatio + 25 * singleH1Ratio + 20 * headingRichRatio),
      rationale: "Clean semantic HTML structure that survives extraction to markdown.",
      keyFinding: `${Math.round(headingHierarchyRatio * 100)}% clean heading hierarchy; ${Math.round(singleH1Ratio * 100)}% have single H1.` },
  ];
  return base
    .map((s) => ({ ...s, status: scoreStatus(s.score), fixPriority: priorityFromScore(s.score) }))
    .sort((a, b) => a.score - b.score);
}

function letterGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 40) return "D";
  return "F";
}

export const runAeoAudit = createServerFn({ method: "POST" })
  .validator((data: { url: string; projectId: string; maxPages?: number }) => data)
  .handler(async ({ data: { url, projectId, maxPages = 10 } }) => {
    // Top-level try/catch: TanStack Start's seroval can only serialize plain Error objects.
    // Any complex thrown value (Supabase errors, fetch AbortErrors, etc.) must be caught
    // here and re-thrown as a simple new Error(message) to avoid the
    // "Cannot read properties of undefined (reading 'url')" client crash.
    try {
      if (!url) throw new Error("URL is required");

      let normalized: string;
      try {
        normalized = normalizeUrl(url);
      } catch {
        throw new Error(`Invalid URL: ${url}`);
      }

      const crawlLimit = Math.max(1, Math.min(MAX_CRAWL_LIMIT, maxPages));

      const [crawlResult, llmsTxtResult] = await Promise.all([
        crawlSite(normalized, crawlLimit),
        validateLlmsTxt(new URL(normalized)),
      ]);

      if (crawlResult.pageAudits.length === 0) {
        throw new Error(`Could not crawl any pages from ${normalized}. The site may be blocking crawlers or have no accessible pages.`);
      }

      const rssFeedFound = await detectRssFeed(crawlResult.startPageHtml, new URL(normalized));
      const checks = aggregateChecks(crawlResult.pageAudits);

      const llmsValid = isLlmsTxtValid(llmsTxtResult);
      checks.push({
        id: "llms-txt", label: "llms.txt valid", passed: llmsValid, points: 10,
        details: !llmsTxtResult.found
          ? "No llms.txt found."
          : llmsValid
            ? `Valid llms.txt (${llmsTxtResult.contentLength} chars)${llmsTxtResult.fullTxtFound ? " + llms-full.txt" : ""}.`
            : `Found llms.txt but ${!llmsTxtResult.hasH1 ? "missing # heading" : !llmsTxtResult.hasLink ? "missing links" : "too short"}.`,
      });

      const blockedBots = crawlResult.robotsPolicy.aiBotBlocked;
      checks.push({
        id: "ai-bot-access", label: "AI bot access", passed: blockedBots.length === 0, points: 12,
        details: blockedBots.length === 0 ? "No AI bots blocked in robots.txt." : `Blocked: ${blockedBots.join(", ")}`,
      });
      checks.push({
        id: "rss-feed", label: "RSS/Atom feed", passed: rssFeedFound, points: 8,
        details: rssFeedFound ? "RSS or Atom feed detected." : "No RSS/Atom feed found.",
      });

      const coverage = buildCoverage(crawlResult.pageAudits);
      const prioritizedFixes = buildPrioritizedFixes(checks, coverage, llmsValid, blockedBots);
      const intelligenceSignals = buildIntelligenceSignals({
        pageAudits: crawlResult.pageAudits, coverage, blockedBots, rssFeedFound,
        discoveredFromSitemap: crawlResult.discoveredFromSitemap,
        failedPages: crawlResult.failedPages, maxPages: crawlLimit,
      });

      const earnedPoints = checks.reduce((s, c) => s + (c.passed ? c.points : 0), 0);
      const maxPoints = checks.reduce((s, c) => s + c.points, 0);
      const foundationalScore = scoreToInt((earnedPoints / Math.max(1, maxPoints)) * 100);
      const heuristicIntelligenceScore = scoreToInt(average(intelligenceSignals.map((s) => s.score)));
      const provisionalScore = scoreToInt(0.5 * foundationalScore + 0.5 * heuristicIntelligenceScore);

      const report = {
        url: normalized,
        generatedAt: new Date().toISOString(),
        crawledPages: crawlResult.pageAudits.length,
        maxPages: crawlLimit,
        scoring: {
          foundationalScore,
          heuristicIntelligenceScore,
          provisionalScore,
          provisionalGrade: letterGrade(provisionalScore),
        },
        checks,
        coverage,
        prioritizedFixes,
        heuristicIntelligenceSignals: intelligenceSignals,
      };

      // Save prioritized fixes into content_suggestions table in Supabase (best-effort)
      if (projectId) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const suggestionRows = prioritizedFixes.map(fix => ({
            project_id: projectId,
            suggestion_type: "page_analysis",
            title: fix.title,
            action: fix.why,
            impact: fix.impact.toLowerCase(),
            is_implemented: false
          }));

          if (suggestionRows.length > 0) {
            await supabaseAdmin.from("content_suggestions")
              .insert(suggestionRows);
          }
        } catch (dbErr: any) {
          console.warn("[AEO] DB save skipped (service key not configured or insert failed):", dbErr?.message ?? dbErr);
        }
      }

      return report;
    } catch (err: any) {
      // Ensure only plain serializable Error objects escape this handler.
      // Complex objects (AbortError, Supabase errors with extra props, etc.)
      // cause TanStack Start's seroval to crash on the client side.
      const message = err instanceof Error ? err.message : String(err ?? "AEO audit failed");
      throw new Error(message);
    }
  });


