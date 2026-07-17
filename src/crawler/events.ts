import { EventEmitter } from 'events';
import { PageData, CrawlContext } from './types';

// Create a custom event emitter for the crawler
class CrawlEventEmitter extends EventEmitter {}

export const crawlEmitter = new CrawlEventEmitter();

// Strong typing for our specific events
export declare interface CrawlEventEmitter {
  on(event: 'page.normalized', listener: (page: PageData, ctx: CrawlContext) => void): this;
  on(event: 'crawl.completed', listener: (ctx: CrawlContext) => void): this;
  
  emit(event: 'page.normalized', page: PageData, ctx: CrawlContext): boolean;
  emit(event: 'crawl.completed', ctx: CrawlContext): boolean;
}
