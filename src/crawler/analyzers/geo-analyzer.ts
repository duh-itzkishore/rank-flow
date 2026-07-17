import { CrawlEventEmitter } from '../events';
import { PageData, CrawlContext, CrawlIssue } from '../types';

const AI_BOT_AGENTS = ["gptbot", "claudebot", "perplexitybot", "google-extended", "oai-searchbot"];

export function register(emitter: CrawlEventEmitter): void {
  emitter.on('page.normalized', (page: PageData, ctx: CrawlContext) => {
    const issues: CrawlIssue[] = [];

    // Check schema for AI specific entities
    if (page.schemaScripts > 0) {
      issues.push({
        analyzer: 'geo-analyzer',
        severity: 'success',
        type: 'schema_present',
        title: 'Structured Data Found',
        description: `Found ${page.schemaScripts} JSON-LD blocks. Useful for AEO.`
      });
    } else {
      issues.push({
        analyzer: 'geo-analyzer',
        severity: 'warning',
        type: 'no_schema',
        title: 'Missing Structured Data',
        description: 'No JSON-LD found. AI bots heavily rely on schema.'
      });
    }

    // Check content depth
    if (page.wordCount < 300) {
      issues.push({
        analyzer: 'geo-analyzer',
        severity: 'warning',
        type: 'thin_content',
        title: 'Thin Content',
        description: `Page has ~${page.wordCount} words. AI engines prefer comprehensive answers.`
      });
    } else if (page.wordCount > 1000) {
      issues.push({
        analyzer: 'geo-analyzer',
        severity: 'success',
        type: 'comprehensive_content',
        title: 'Comprehensive Content',
        description: `Page has ~${page.wordCount} words. Good depth for LLM consumption.`
      });
    }

    // Checking robots meta for general AI blockage isn't always explicit in HTML, but we can look for 'noai'
    if (page.robotsMeta && (page.robotsMeta.toLowerCase().includes('noai') || page.robotsMeta.toLowerCase().includes('noimageai'))) {
      issues.push({
        analyzer: 'geo-analyzer',
        severity: 'error',
        type: 'ai_blocked',
        title: 'AI Explicitly Blocked',
        description: 'Page explicitly blocks AI scraping via robots meta tag.'
      });
    }

    ctx.issues.push(...issues);
  });
}
