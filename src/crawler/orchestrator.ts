import { crawlEmitter } from './events';
import { CrawlJob, CrawlContext, PageData } from './types';
import { fetchWithCheerio } from './fetchers/cheerio-fetcher';
import { fetchWithPlaywright } from './fetchers/playwright-fetcher';
import { determineStrategy } from './strategy-selector';
import { extractPageData } from './extractor';
import { register as registerTechnicalSeo } from './analyzers/technical-seo';
import { register as registerGeo } from './analyzers/geo-analyzer';

// Register analyzers
registerTechnicalSeo(crawlEmitter);
registerGeo(crawlEmitter);

export class CrawlOrchestrator {
  static async runCrawl(job: CrawlJob, startUrl: string): Promise<CrawlContext> {
    const ctx: CrawlContext = {
      job,
      issues: [],
      pages: [],
      visitedUrls: new Set()
    };

    // Very basic crawler loop for initial prototype.
    // In reality, this would use a queue and honor limits/robots.
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    const MAX_PAGES = 50;

    while (queue.length > 0 && ctx.pages.length < MAX_PAGES) {
      const { url, depth } = queue.shift()!;
      
      if (ctx.visitedUrls.has(url)) continue;
      ctx.visitedUrls.add(url);

      const strategy = await determineStrategy(url);
      
      let fetchResult;
      if (strategy === 'playwright') {
        fetchResult = await fetchWithPlaywright(url);
      } else {
        fetchResult = await fetchWithCheerio(url);
      }

      if (fetchResult.html) {
        const pageData = extractPageData(fetchResult.html, fetchResult.url, depth);
        ctx.pages.push(pageData);
        
        // Emit for analyzers
        crawlEmitter.emit('page.normalized', pageData, ctx);

        // Basic discovery
        if (depth < 2) {
          for (const link of pageData.links) {
            if (!link.external && !ctx.visitedUrls.has(link.href)) {
              // Ensure we don't queue infinite variations
              const cleanUrl = link.href.split('#')[0];
              if (!ctx.visitedUrls.has(cleanUrl)) {
                queue.push({ url: cleanUrl, depth: depth + 1 });
              }
            }
          }
        }
      }
    }

    crawlEmitter.emit('crawl.completed', ctx);
    
    return ctx;
  }
}
