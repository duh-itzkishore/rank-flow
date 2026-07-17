export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CrawlJob {
  id: string;
  project_id: string;
  status: CrawlJobStatus;
  crawl_type: string;
  config: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PageData {
  url: string;
  depth: number;
  title: string;
  description: string;
  metaTitle: string;
  canonical: string | null;
  robotsMeta: string | null;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  links: { href: string; text: string; external: boolean }[];
  images: { src: string; alt: string }[];
  schemaScripts: number;
  wordCount: number;
  html?: string; // Optional raw html, usually omitted to save space
}

export type IssueSeverity = 'error' | 'warning' | 'info' | 'success';

export interface CrawlIssue {
  analyzer: string;
  severity: IssueSeverity;
  type: string;
  title: string;
  description: string;
  evidence?: any;
}

export interface FetcherResult {
  url: string;
  html: string;
  status: number;
  headers: Record<string, string>;
  timingMs: number;
  fetcherUsed: 'cheerio' | 'playwright' | 'serp' | 'llm';
}

export interface CrawlContext {
  job: CrawlJob;
  issues: CrawlIssue[];
  pages: PageData[];
  visitedUrls: Set<string>;
}
