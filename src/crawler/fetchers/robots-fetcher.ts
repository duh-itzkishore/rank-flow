export interface RobotsResult {
  allowed: boolean;
  sitemaps: string[];
  rules: { agent: string; allow: string[]; disallow: string[] }[];
}

export async function fetchRobotsTxt(baseUrl: string): Promise<RobotsResult> {
  const url = new URL('/robots.txt', baseUrl).toString();
  const result: RobotsResult = { allowed: true, sitemaps: [], rules: [] };
  
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return result;
    
    const text = await res.text();
    let currentAgent = '*';
    let currentRule = { agent: '*', allow: [] as string[], disallow: [] as string[] };
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const parts = trimmed.split(':');
      if (parts.length < 2) continue;
      
      const key = parts[0].trim().toLowerCase();
      const value = parts.slice(1).join(':').trim();
      
      if (key === 'user-agent') {
        if (currentAgent !== '*' || currentRule.allow.length > 0 || currentRule.disallow.length > 0) {
          result.rules.push(currentRule);
        }
        currentAgent = value.toLowerCase();
        currentRule = { agent: currentAgent, allow: [], disallow: [] };
      } else if (key === 'allow') {
        currentRule.allow.push(value);
      } else if (key === 'disallow') {
        currentRule.disallow.push(value);
      } else if (key === 'sitemap') {
        result.sitemaps.push(value);
      }
    }
    
    if (currentRule.allow.length > 0 || currentRule.disallow.length > 0) {
      result.rules.push(currentRule);
    }
    
    return result;
  } catch (err) {
    return result;
  }
}
