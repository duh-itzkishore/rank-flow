export async function determineStrategy(url: string): Promise<'cheerio' | 'playwright'> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { 
      method: 'GET', // Some servers block HEAD or return empty body, but we'll stream and abort
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return 'cheerio'; // It's not HTML anyway, we'll probably fail or skip
    }

    const poweredBy = (res.headers.get('x-powered-by') || '').toLowerCase();
    
    // Hints of SSR frameworks which often hydrate (Next, Nuxt, SvelteKit)
    if (poweredBy.includes('next') || poweredBy.includes('nuxt')) {
      // Actually Next.js SSR can be parsed statically for SEO, but typically React apps need JS for full content
      // We will read a bit of the body
    }

    const text = await res.text();
    
    // Rough heuristic: if the body is very small but has script tags, or has a known mount point like <div id="root"> or <div id="__next">
    const hasMountPoint = /id="(root|app|__next)"/i.test(text);
    const hasScripts = /<script\b[^>]*src=/i.test(text);
    
    // For many modern SPA, body content length without tags is very small
    // A more advanced check would strip tags and check text length.
    
    if (hasMountPoint && hasScripts && text.length < 50000) {
      return 'playwright';
    }

    return 'cheerio';
  } catch (error) {
    // Fallback to cheerio on error or timeout
    return 'cheerio';
  }
}
