import { createFileRoute } from "@tanstack/react-router";

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

        const targetUrl = url.startsWith("http") ? url : `https://${url}`;

        let browser;
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
          
          const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1,
            locale: "en-US",
            timezoneId: "America/New_York",
            extraHTTPHeaders: {
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
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

          const metrics = await page.evaluate(() => {
            const metaDesc =
              document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
            const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.title;
            const h1s = Array.from(document.querySelectorAll("h1")).map((h) => (h as HTMLElement).innerText.trim()).filter(Boolean);
            const canonicalEl = document.querySelector('link[rel="canonical"]');
            const canonical = canonicalEl ? canonicalEl.getAttribute("href") : null;
            const links = Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href).filter((h) => h.startsWith("http"));
            const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute("content") || null;
            const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]').length;

            return { title: document.title, description: metaDesc, metaTitle, h1s, canonical, totalLinks: links.length, robotsMeta, schemaScripts };
          });

          // Build SEO issues list
          const issues: Array<{ id: number; type: string; title: string; count: number; description: string }> = [];

          if (!metrics.description) {
            issues.push({ id: 1, type: "error", title: "Missing Meta Description", count: 1, description: "No <meta name='description'> tag found. Required for AI search snippets." });
          }
          if (!metrics.title) {
            issues.push({ id: 2, type: "error", title: "Missing Page Title", count: 1, description: "No <title> tag found. Critical for both traditional and AI search." });
          }
          if (metrics.h1s.length === 0) {
            issues.push({ id: 3, type: "error", title: "Missing H1 Tag", count: 1, description: "No primary heading found. AI crawlers rely on H1 to understand page topic." });
          } else if (metrics.h1s.length > 1) {
            issues.push({ id: 4, type: "warning", title: "Duplicate H1 Tags", count: metrics.h1s.length, description: `Found ${metrics.h1s.length} H1 headings. Page should have exactly one.` });
          }
          if (!metrics.canonical) {
            issues.push({ id: 5, type: "warning", title: "Missing Canonical Tag", count: 1, description: "No <link rel='canonical'> found. May cause duplicate content issues." });
          }
          if (metrics.schemaScripts === 0) {
            issues.push({ id: 6, type: "warning", title: "No Structured Data (Schema)", count: 1, description: "No JSON-LD schema found. Schema markup significantly improves AEO/GEO visibility." });
          } else {
            issues.push({ id: 7, type: "success", title: "Structured Data Present", count: metrics.schemaScripts, description: `Found ${metrics.schemaScripts} JSON-LD schema block(s). Excellent for AI visibility.` });
          }
          if (metrics.robotsMeta && metrics.robotsMeta.includes("noindex")) {
            issues.push({ id: 8, type: "error", title: "Page Marked noindex", count: 1, description: "Robots meta tag includes 'noindex'. This page will be excluded from search entirely." });
          }

          const errorCount = issues.filter((i) => i.type === "error").length;
          const warningCount = issues.filter((i) => i.type === "warning").length;
          const healthScore = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

          return new Response(
            JSON.stringify({ success: true, url: targetUrl, metrics, issues, healthScore }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("SEO Audit Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        } finally {
          if (browser) await browser.close();
        }
      },
    },
  },
});
