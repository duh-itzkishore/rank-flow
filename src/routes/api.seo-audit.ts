import { createFileRoute } from "@tanstack/react-router";
import * as cheerio from "cheerio";
import { launchBrowser } from "../lib/browser-launcher";

export const Route = createFileRoute("/api/seo-audit")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url).searchParams.get("url");

        if (!url) {
          return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        let targetUrl = "";
        let domain = "";
        try {
          targetUrl = url.startsWith("http") ? url : `https://${url}`;
          const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("::1");
          if (isLocal && !url.startsWith("http")) {
            targetUrl = `http://${url}`;
          }
          domain = new URL(targetUrl).origin;
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: "Invalid URL format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Fetch robots.txt
        let robotsTxt = "";
        try {
          const robRes = await fetch(`${domain}/robots.txt`, { signal: AbortSignal.timeout(3000) });
          if (robRes.ok) robotsTxt = await robRes.text();
        } catch (e) {}

        // Fetch llms.txt
        let llmsTxtStatus = "Not found";
        try {
          const llmsRes = await fetch(`${domain}/llms.txt`, { signal: AbortSignal.timeout(3000) });
          if (llmsRes.ok) {
            llmsTxtStatus = "Found llms.txt";
          } else {
            const llmsFullRes = await fetch(`${domain}/llms-full.txt`, { signal: AbortSignal.timeout(3000) });
            if (llmsFullRes.ok) llmsTxtStatus = "Found llms-full.txt";
          }
        } catch (e) {}

        // Fetch Raw HTML for Agent View
        let rawHtml = "";
        let agentWords = 0;
        let pageSize = 0;
        let agentText = "";
        try {
          const rawRes = await fetch(targetUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
            signal: AbortSignal.timeout(5000)
          });
          if (rawRes.ok) {
            rawHtml = await rawRes.text();
            pageSize = rawHtml.length;
            // Basic tag stripping
            agentText = rawHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            agentWords = agentText.split(/\s+/).filter(w => w.length > 0).length;
          }
        } catch (e) {}

        let browser: any = null;
        let metrics: any = null;

        try {
          browser = await launchBrowser({ 
            headless: true,
            args: [
              "--disable-blink-features=AutomationControlled",
              "--use-fake-ui-for-media-stream",
              "--use-fake-device-for-media-stream"
            ]
          });
          
          const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1,
            locale: "en-US",
            timezoneId: "America/New_York",
            extraHTTPHeaders: {
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Upgrade-Insecure-Requests": "1",
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-User": "?1"
            }
          });

          const page = await context.newPage();

          // Hide webdriver property
          await page.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", {
              get: () => undefined,
            });
          });

          await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

          metrics = await page.evaluate(() => {
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
            const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.title;
            const h1s = Array.from(document.querySelectorAll("h1")).map((h) => (h as HTMLElement).innerText.trim()).filter(Boolean);
            const canonicalEl = document.querySelector('link[rel="canonical"]');
            const canonical = canonicalEl ? canonicalEl.getAttribute("href") : null;
            const links = Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href).filter((h) => h.startsWith("http"));
            const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute("content") || null;
            
            const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
              try { return JSON.parse(s.innerHTML); } catch (e) { return null; }
            }).filter(Boolean);

            const humanText = document.body ? (document.body.innerText || "").replace(/\s+/g, ' ').trim() : "";
            return { 
              title: document.title, description: metaDesc, metaTitle, h1s, canonical, 
              totalLinks: links.length, robotsMeta, schemas: schemaScripts, humanText 
            };
          });
        } catch (err) {
          console.warn("[SEO Audit API] Headless browser execution warning, falling back to HTTP Cheerio parser:", err);
        } finally {
          if (browser) {
            await browser.close().catch(() => {});
          }
        }

        // Fallback to Cheerio HTML extraction if browser evaluation failed or couldn't run
        if (!metrics) {
          const $ = cheerio.load(rawHtml || "");
          const title = $("title").text().trim() || "";
          const metaDesc = $('meta[name="description"]').attr("content") || "";
          const metaTitle = $('meta[property="og:title"]').attr("content") || title;
          const h1s = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
          const canonical = $('link[rel="canonical"]').attr("href") || null;
          const links = $("a[href]").map((_, el) => $(el).attr("href")).get().filter((h): h is string => Boolean(h && h.startsWith("http")));
          const robotsMeta = $('meta[name="robots"]').attr("content") || null;

          const schemaScripts: any[] = [];
          $('script[type="application/ld+json"]').each((_, el) => {
            try {
              const parsed = JSON.parse($(el).html() || "");
              if (parsed) schemaScripts.push(parsed);
            } catch {}
          });

          metrics = {
            title,
            description: metaDesc,
            metaTitle,
            h1s,
            canonical,
            totalLinks: links.length,
            robotsMeta,
            schemas: schemaScripts,
            humanText: agentText
          };
        }

        try {
          const humanWordsCount = metrics.humanText ? metrics.humanText.split(/\s+/).filter((w: string) => w.length > 0).length : 0;
          
          // Calculate AI Readability Score
          const aiVisibilityScore = humanWordsCount > 0 ? Math.min(100, Math.round((agentWords / humanWordsCount) * 100)) : 0;

          // Process Top Words
          const words = metrics.humanText ? metrics.humanText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3) : [];
          const stopWords = new Set(["this","that","with","from","your","have","will","what","when","where","there","their","they","about","which","would","could","should","other","some","more","than","then","only","also","into","very","much","many","such","even","like","just","most"]);
          const counts: Record<string, number> = {};
          words.forEach((w: string) => { if (!stopWords.has(w)) counts[w] = (counts[w] || 0) + 1; });
          const topWords = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([phrase, count]) => ({ phrase, count, percent: words.length > 0 ? ((count / words.length) * 100).toFixed(2) : "0" }));

          // Process Schema Types
          const schemaTypes = metrics.schemas.map((s: any) => s["@type"]).filter(Boolean);

          // Calculate Flesch Reading Ease (approximate)
          const sentences = metrics.humanText ? (metrics.humanText.split(/[.!?]+/).filter(Boolean).length || 1) : 1;
          const syllables = words.length * 1.5;
          const flesch = humanWordsCount > 0 
            ? Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (humanWordsCount / sentences) - 84.6 * (syllables / humanWordsCount))))
            : 0;

          // Build SEO issues list
          const issues: Array<{ id: number; type: string; title: string; count: number; description: string }> = [];

          if (!metrics.description) issues.push({ id: 1, type: "error", title: "Missing Meta Description", count: 1, description: "No <meta name='description'> tag found. Required for AI search snippets." });
          if (!metrics.title) issues.push({ id: 2, type: "error", title: "Missing Page Title", count: 1, description: "No <title> tag found. Critical for both traditional and AI search." });
          if (metrics.h1s.length === 0) issues.push({ id: 3, type: "error", title: "Missing H1 Tag", count: 1, description: "No primary heading found. AI crawlers rely on H1 to understand page topic." });
          if (metrics.schemas.length === 0 && schemaTypes.length === 0) issues.push({ id: 6, type: "warning", title: "No Structured Data (Schema)", count: 1, description: "No JSON-LD schema found. Schema markup significantly improves AEO/GEO visibility." });
          if (llmsTxtStatus === "Not found") issues.push({ id: 7, type: "warning", title: "Missing llms.txt", count: 1, description: "No llms.txt found. Consider adding one to feed AI bots structured markdown." });

          const errorCount = issues.filter((i) => i.type === "error").length;
          const warningCount = issues.filter((i) => i.type === "warning").length;
          const healthScore = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

          return new Response(
            JSON.stringify({ 
              success: true, 
              url: targetUrl, 
              metrics, 
              issues, 
              healthScore,
              aeo: {
                agentWords,
                humanWords: humanWordsCount,
                visibilityScore: aiVisibilityScore,
                agentTextSnippet: agentText.substring(0, 500) + "...",
                humanTextSnippet: (metrics.humanText || "").substring(0, 500) + "...",
                robotsTxt,
                llmsTxtStatus,
                pageSizeKb: (pageSize / 1024).toFixed(1),
                schemaTypes,
                readability: flesch,
                topWords
              }
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("SEO Audit Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
