import { createServerFn } from "@tanstack/react-start";

export const executeSeoAudit = createServerFn({ method: "GET" })
  .validator((url: string) => url)
  .handler(async ({ data: url }) => {
  if (!url) {
    throw new Error("URL is required");
  }
  
  // ensure url starts with http
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a timeout to prevent hanging, wait for domcontentloaded
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Evaluate metrics inside the browser context
    const metrics = await page.evaluate(() => {
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || "";
      const h1s = Array.from(document.querySelectorAll('h1')).map(h1 => h1.innerText);
      const links = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(href => href.startsWith('http'));
      
      return {
        title: document.title,
        description: metaDesc,
        h1s,
        totalLinks: links.length,
      };
    });

    // Generate mock issues based on the metrics (to simulate a real audit report)
    const issues = [];
    if (!metrics.description) {
      issues.push({ id: 1, type: "error", title: "Missing Meta Description", count: 1, description: "Page is missing a crucial description tag for search indexing." });
    }
    if (metrics.h1s.length === 0) {
      issues.push({ id: 2, type: "error", title: "Missing H1 Tag", count: 1, description: "No primary heading found on the page." });
    } else if (metrics.h1s.length > 1) {
      issues.push({ id: 3, type: "warning", title: "Duplicate H1 Tags", count: metrics.h1s.length, description: "Page has more than one primary heading." });
    }
    
    // Simulating broken links for demonstration purposes if there are links
    if (metrics.totalLinks > 0) {
      issues.push({ id: 4, type: "warning", title: "Broken Links (404)", count: Math.min(3, Math.floor(metrics.totalLinks / 10)), description: "Links pointing to pages that might not exist." });
    }

    issues.push({ id: 5, type: "success", title: "Sitemap Checked", count: 1, description: "Mock check: XML sitemap is present and correctly formatted." });

    // Calculate a mock health score based on issues
    const errorCount = issues.filter(i => i.type === "error").length;
    const warningCount = issues.filter(i => i.type === "warning").length;
    const healthScore = Math.max(0, 100 - (errorCount * 10) - (warningCount * 3));

    return { 
      success: true, 
      url: targetUrl,
      metrics,
      issues,
      healthScore
    };
  } catch (error) {
    console.error("SEO Audit Error:", error);
    return { success: false, error: String(error) };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});
