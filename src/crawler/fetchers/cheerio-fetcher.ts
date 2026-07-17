import { FetcherResult } from '../types';

export async function fetchWithCheerio(url: string): Promise<FetcherResult> {
  const start = performance.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    clearTimeout(timeout);
    
    const html = await res.text();
    const timingMs = performance.now() - start;
    
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url,
      html,
      status: res.status,
      headers,
      timingMs,
      fetcherUsed: 'cheerio'
    };
  } catch (error) {
    const timingMs = performance.now() - start;
    return {
      url,
      html: '',
      status: 0,
      headers: {},
      timingMs,
      fetcherUsed: 'cheerio'
    };
  }
}
