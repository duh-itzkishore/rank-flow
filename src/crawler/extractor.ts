import * as cheerio from 'cheerio';
import { PageData } from './types';

export function extractPageData(html: string, url: string, depth: number): PageData {
  const $ = cheerio.load(html);
  
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const metaTitle = $('meta[property="og:title"]').attr('content') || title;
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const robotsMeta = $('meta[name="robots"]').attr('content') || null;
  
  const h1s: string[] = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1s.push(text);
  });
  
  const h2s: string[] = [];
  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2s.push(text);
  });

  const h3s: string[] = [];
  $('h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h3s.push(text);
  });

  const links: { href: string; text: string; external: boolean }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    
    try {
      const parsedUrl = new URL(href, url);
      const isExternal = parsedUrl.hostname !== new URL(url).hostname;
      // Skip mailto, tel, javascript, hash links
      if (['http:', 'https:'].includes(parsedUrl.protocol)) {
        links.push({
          href: parsedUrl.toString(),
          text: $(el).text().trim().substring(0, 100),
          external: isExternal
        });
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });

  const images: { src: string; alt: string }[] = [];
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src) {
      try {
        const parsedUrl = new URL(src, url);
        images.push({ src: parsedUrl.toString(), alt: alt.trim() });
      } catch (e) {}
    }
  });

  const schemaScripts = $('script[type="application/ld+json"]').length;
  
  // Basic word count (removing scripts, styles, etc)
  $('script, style, noscript, iframe, svg').remove();
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length;

  return {
    url,
    depth,
    title,
    description,
    metaTitle,
    canonical,
    robotsMeta,
    h1s,
    h2s,
    h3s,
    links,
    images,
    schemaScripts,
    wordCount
  };
}
