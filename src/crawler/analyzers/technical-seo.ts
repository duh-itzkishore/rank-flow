import { CrawlEventEmitter } from '../events';
import { PageData, CrawlContext, CrawlIssue } from '../types';

export function register(emitter: CrawlEventEmitter): void {
  emitter.on('page.normalized', (page: PageData, ctx: CrawlContext) => {
    const issues: CrawlIssue[] = [];

    if (!page.title) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'error',
        type: 'missing_title',
        title: 'Missing Page Title',
        description: 'Page does not have a <title> tag.'
      });
    } else if (page.title.length < 10 || page.title.length > 70) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'warning',
        type: 'title_length',
        title: 'Title Length Suboptimal',
        description: `Title is ${page.title.length} characters long. Recommended is 30-60 characters.`
      });
    }

    if (!page.description) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'error',
        type: 'missing_description',
        title: 'Missing Meta Description',
        description: 'Page does not have a <meta name="description"> tag.'
      });
    } else if (page.description.length < 50 || page.description.length > 160) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'warning',
        type: 'description_length',
        title: 'Meta Description Length Suboptimal',
        description: `Description is ${page.description.length} characters long. Recommended is 120-160 characters.`
      });
    }

    if (page.h1s.length === 0) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'error',
        type: 'missing_h1',
        title: 'Missing H1 Tag',
        description: 'Page has no H1 heading.'
      });
    } else if (page.h1s.length > 1) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'warning',
        type: 'multiple_h1s',
        title: 'Multiple H1 Tags',
        description: `Page has ${page.h1s.length} H1 tags. It is generally recommended to have exactly one.`
      });
    }

    if (!page.canonical) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'warning',
        type: 'missing_canonical',
        title: 'Missing Canonical Tag',
        description: 'Page does not have a canonical link defined.'
      });
    }

    if (page.robotsMeta && (page.robotsMeta.includes('noindex') || page.robotsMeta.includes('nofollow'))) {
      issues.push({
        analyzer: 'technical-seo',
        severity: 'info',
        type: 'robots_restriction',
        title: 'Robots Meta Restriction',
        description: `Page robots meta contains restrictive directives: ${page.robotsMeta}`
      });
    }

    ctx.issues.push(...issues);
  });
}
