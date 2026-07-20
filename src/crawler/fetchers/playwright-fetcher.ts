import { FetcherResult } from '../types';
import { launchBrowser } from '../../lib/browser-launcher';

export async function fetchWithPlaywright(url: string): Promise<FetcherResult> {
  const start = performance.now();
  let browser: any = null;

  try {
    browser = await launchBrowser({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    // Attempt to mask webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    const html = await page.content();
    
    const status = response ? response.status() : 0;
    const headers = response ? response.headers() : {};
    const timingMs = performance.now() - start;

    return {
      url,
      html,
      status,
      headers,
      timingMs,
      fetcherUsed: 'playwright'
    };
  } catch (error) {
    console.error('Playwright fetch error:', error);
    const timingMs = performance.now() - start;
    return {
      url,
      html: '',
      status: 0,
      headers: {},
      timingMs,
      fetcherUsed: 'playwright'
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
