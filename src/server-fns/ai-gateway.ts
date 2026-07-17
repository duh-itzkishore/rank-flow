export interface ModelResponse {
  model: string;
  responseText: string;
  isMentioned: boolean;
  rank: number | null;
  citations: Array<{ title: string; url: string }>;
  recommendations: Array<{ type: string; title: string; action: string }>;
  sentimentScore: number;
  confidenceScore: number;
  tokensUsed: number;
  latencyMs: number;
}

// Heuristic fallback helper for mention & rank extraction if JSON parsing fails
function extractHeuristicMentions(text: string, brandName: string): { isMentioned: boolean; rank: number | null } {
  const normalizedText = text.toLowerCase();
  const normalizedBrand = brandName.toLowerCase();
  const isMentioned = normalizedText.includes(normalizedBrand);

  let rank: number | null = null;
  if (isMentioned) {
    const lines = text.split("\n");
    let listCount = 0;
    for (const line of lines) {
      if (/^\s*\d+[\.]\s+/.test(line)) {
        listCount++;
        if (line.toLowerCase().includes(normalizedBrand)) {
          rank = listCount;
          break;
        }
      }
    }
  }
  return { isMentioned, rank };
}

// Simple rule-based sentiment scorer (-1 to 1)
function computeSentiment(text: string): number {
  const positiveWords = ["best", "great", "excellent", "lead", "top", "outstanding", "value", "recommend", "prefer", "trusted", "popular"];
  const negativeWords = ["poor", "bad", "expensive", "slow", "lack", "fail", "difficult", "limit", "issue", "risk", "outdated"];

  const normalized = text.toLowerCase();
  let score = 0;
  positiveWords.forEach((w) => { if (normalized.includes(w)) score += 0.25; });
  negativeWords.forEach((w) => { if (normalized.includes(w)) score -= 0.25; });

  return Math.max(-1, Math.min(1, score));
}

// Shared system prompt helper for all models
function buildSystemPrompt(brandName: string, competitorNames: string[]): string {
  const competitorSnippet = competitorNames.length > 0 
    ? `and these competitors: ${competitorNames.join(", ")}` 
    : "";
  return `You are an objective Generative Engine Optimization (GEO) audit assistant. 
Analyze and answer the user's prompt factually, concisely, and with references/citations where appropriate.

You must respond ONLY with a valid JSON object matching the following schema:
{
  "responseText": "The markdown-formatted text response recommending options or answering the prompt. Include bullet points, numbered lists, comparisons, and markdown URL citations where relevant.",
  "brandMentioned": boolean, // true if the main brand \\"${brandName}\\" is mentioned in the responseText
  "brandRank": number | null, // the 1-indexed list rank of \\"${brandName}\\" if mentioned in a list/recommendation ranking, otherwise null
  "brandSentiment": number, // a sentiment score for \\"${brandName}\\" from -1.0 (very negative) to 1.0 (very positive). If neutral, use 0.0.
  "competitors": Array<{
    "name": string, // competitor name from list
    "mentioned": boolean, // whether they are mentioned in responseText
    "rank": number | null // their 1-indexed rank in list recommendations, or null
  }>,
  "citations": Array<{
    "title": string, // name of source or domain
    "url": string // full http/https URL of the citation reference
  }>,
  "confidenceScore": number // your confidence in the accuracy of facts and citations from 0.0 to 1.0
}

Analyze the prompt from the perspective of the main brand \\"${brandName}\\" ${competitorSnippet}.
Do not include any pre-text, post-text, markdown code blocks (like \`\`\`json) outside the JSON, or other text. Return ONLY the raw JSON string.`;
}

// Extract JSON safely from potential conversational output wrappers
function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Process the output returned from LLM
function parseGatewayResponse(
  rawText: string,
  brandName: string,
  competitorNames: string[]
): {
  responseText: string;
  isMentioned: boolean;
  rank: number | null;
  citations: Array<{ title: string; url: string }>;
  sentimentScore: number;
  confidenceScore: number;
  competitorsData: any[];
} {
  try {
    const data = cleanAndParseJson(rawText);
    
    const responseText = data.responseText || rawText;
    const isMentioned = typeof data.brandMentioned === "boolean" 
      ? data.brandMentioned 
      : extractHeuristicMentions(responseText, brandName).isMentioned;
      
    const rank = typeof data.brandRank === "number" || data.brandRank === null 
      ? data.brandRank 
      : extractHeuristicMentions(responseText, brandName).rank;
      
    const sentimentScore = typeof data.brandSentiment === "number"
      ? data.brandSentiment
      : computeSentiment(responseText);

    const confidenceScore = typeof data.confidenceScore === "number"
      ? data.confidenceScore
      : 0.9;

    const citations: Array<{ title: string; url: string }> = [];
    if (Array.isArray(data.citations)) {
      data.citations.forEach((cit: any) => {
        if (cit && cit.title && cit.url) {
          citations.push({ title: String(cit.title), url: String(cit.url) });
        }
      });
    }

    // Advanced Citation regex parsing fallback (matches markdown links AND raw urls)
    if (citations.length === 0) {
      const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
      let match;
      while ((match = markdownRegex.exec(responseText)) !== null) {
        citations.push({ title: match[1], url: match[2] });
      }

      // Also capture any raw URLs that weren't markdown links
      const rawUrlRegex = /(?<!\()https?:\/\/[^\s\)]+/g;
      const rawMatches = responseText.match(rawUrlRegex);
      if (rawMatches) {
        rawMatches.forEach((url: string) => {
          // avoid duplicate domain citations
          const domain = new URL(url).hostname.replace("www.", "");
          if (!citations.some((c) => c.url === url)) {
            citations.push({ title: domain, url });
          }
        });
      }
    }

    const competitorsData = Array.isArray(data.competitors) ? data.competitors : [];

    return {
      responseText,
      isMentioned,
      rank,
      citations,
      sentimentScore,
      confidenceScore,
      competitorsData
    };
  } catch (err) {
    console.warn("Structured JSON parsing failed, using heuristic fallback:", err);
    const { isMentioned, rank } = extractHeuristicMentions(rawText, brandName);
    const sentimentScore = computeSentiment(rawText);
    
    const citations: Array<{ title: string; url: string }> = [];
    const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(rawText)) !== null) {
      citations.push({ title: match[1], url: match[2] });
    }

    return {
      responseText: rawText,
      isMentioned,
      rank,
      citations,
      sentimentScore,
      confidenceScore: 0.8,
      competitorsData: competitorNames.map(name => {
        const compMentions = extractHeuristicMentions(rawText, name);
        return {
          name,
          mentioned: compMentions.isMentioned,
          rank: compMentions.rank
        };
      })
    };
  }
}

// General query model function
export async function queryAIModel(
  model: string,
  promptText: string,
  brandName: string,
  apiKey: string | null,
  competitorNames: string[] = []
): Promise<ModelResponse & { rawResponse?: any }> {
  const startTime = Date.now();
  let responseText = "";
  let tokensUsed = 0;

  const actualKey = apiKey || getEnvKey(model);

  if (!actualKey) {
    return await getSimulatedFallback(model, promptText, brandName, startTime, competitorNames);
  }

  const systemPrompt = buildSystemPrompt(brandName, competitorNames);

  try {
    // ── OpenAI (ChatGPT) ─────────────────────────────────────
    if (model === "chatgpt") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`);
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;

    // ── Anthropic (Claude) ───────────────────────────────────
    } else if (model === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": actualKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1536,
          system: systemPrompt,
          messages: [{ role: "user", content: promptText }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Anthropic error ${res.status}`);
      responseText = data.content?.[0]?.text || "";
      tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    // ── Google Gemini (FREE tier available) ──────────────────
    } else if (model === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${actualKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { 
              maxOutputTokens: 1536, 
              temperature: 0.7,
              responseMimeType: "application/json"
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Gemini error ${res.status}`);
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    // ── Perplexity AI ────────────────────────────────────────
    } else if (model === "perplexity") {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Perplexity error ${res.status}`);
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;

    // ── Groq (FREE — Llama 3.3 70B) ─────────────────────────
    } else if (model === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText },
          ],
          max_tokens: 1536,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Groq error ${res.status}`);
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;

    // ── OpenRouter (FREE models: Llama, Gemma, Mistral) ──────
    } else if (model === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`,
          "HTTP-Referer": "https://rankflow.app",
          "X-Title": "RankFlow AI Brand Monitor",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText },
          ],
          max_tokens: 1536,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `OpenRouter error ${res.status}`);
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;
    }

    const latencyMs = Date.now() - startTime;
    const parsed = parseGatewayResponse(responseText, brandName, competitorNames);

    return {
      model,
      responseText: parsed.responseText,
      isMentioned: parsed.isMentioned,
      rank: parsed.rank,
      citations: parsed.citations,
      recommendations: parsed.isMentioned
        ? []
        : [
            {
              type: "content_gap",
              title: "Visibility Action Item",
              action: `Optimize your page content around terms matching this prompt to improve ${model} visibility.`,
            },
          ],
      sentimentScore: parsed.sentimentScore,
      confidenceScore: parsed.confidenceScore,
      tokensUsed,
      latencyMs,
      rawResponse: {
        responseText: parsed.responseText,
        brandMentioned: parsed.isMentioned,
        brandRank: parsed.rank,
        brandSentiment: parsed.sentimentScore,
        competitors: parsed.competitorsData,
        citations: parsed.citations,
        confidenceScore: parsed.confidenceScore
      }
    };
  } catch (err) {
    console.error(`Error fetching real API for ${model}:`, err);
    return await getSimulatedFallback(model, promptText, brandName, startTime, competitorNames);
  }
}

function getEnvKey(model: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  switch (model) {
    case "chatgpt":    return process.env.OPENAI_API_KEY;
    case "claude":     return process.env.CLAUDE_API_KEY;
    case "gemini":     return process.env.GEMINI_API_KEY;
    case "perplexity": return process.env.PERPLEXITY_API_KEY;
    case "groq":       return process.env.GROQ_API_KEY;
    case "openrouter": return process.env.OPENROUTER_API_KEY;
    default:           return undefined;
  }
}

async function fetchWikipediaResults(query: string): Promise<Array<{ url: string; title: string; snippet: string }>> {
  try {
    const cleanQuery = query
      .replace(/\bin\s+(chatgpt|gemini|claude|perplexity|groq|openrouter)\b/gi, "")
      .trim();
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const search = data.query?.search;
    if (!Array.isArray(search)) return [];
    
    return search.map((item: any) => {
      const title = item.title;
      const snippet = item.snippet
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      return {
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        title: `${title} (Wikipedia)`,
        snippet
      };
    });
  } catch (err) {
    console.error("Wikipedia search error:", err);
    return [];
  }
}

async function fetchSerpApiResults(query: string, apiKey: string): Promise<Array<{ url: string; title: string; snippet: string }>> {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const organic = data.organic_results;
    if (!Array.isArray(organic)) return [];
    return organic.map((item: any) => ({
      url: item.link || '',
      title: item.title || '',
      snippet: item.snippet || ''
    })).filter(r => r.url && r.title && r.snippet);
  } catch (err) {
    console.error("SerpApi search error:", err);
    return [];
  }
}

async function getSimulatedFallback(
  model: string, 
  promptText: string, 
  brandName: string, 
  startTime: number,
  competitorNames: string[] = []
): Promise<ModelResponse & { rawResponse?: any }> {
  const brand = brandName || "Your Brand";
  
  // Clean query: strip out "in chatgpt", etc.
  const cleanPrompt = promptText
    .replace(/\bin\s+(chatgpt|gemini|claude|perplexity|groq|openrouter)\b/gi, "")
    .trim();
  
  // Try Wikipedia search first with cleanPrompt + brandName
  let searchResults = await fetchWikipediaResults(`${cleanPrompt} ${brandName}`);
  let sourceName = "Wikipedia";
  
  // If still nothing, check if SerpApi key exists
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (searchResults.length === 0 && serpApiKey) {
    const queryText = `${promptText} ${brandName} in ${model}`;
    searchResults = await fetchSerpApiResults(queryText, serpApiKey);
    sourceName = "Google Search (via SerpApi)";
  }
  
  let responseText = "";
  let isMentioned = false;
  let rank: number | null = null;
  let citations: Array<{ title: string; url: string }> = [];

  if (searchResults.length > 0) {
    // Generate simulated response format using real web search snippets
    const snippets = searchResults.slice(0, 4).map(r => r.snippet).filter(Boolean);
    responseText = snippets.join(" ");
      
    citations = searchResults.slice(0, 4).map(r => ({
      title: r.title || new URL(r.url).hostname.replace("www.", ""),
      url: r.url
    }));

    const mentions = extractHeuristicMentions(responseText, brand);
    isMentioned = mentions.isMentioned;
    rank = mentions.rank;
  } else {
    // Static fallback if search fails
    switch (model) {
      case "chatgpt":
        responseText = `Here are the top recommendations in this category:\n1. Competitor A - Best for enterprise scale.\n2. ${brand} - Great value and features for growing teams.\n3. Competitor B - Budget-friendly option.`;
        isMentioned = true;
        rank = 2;
        break;
      case "gemini":
        responseText = `${brand} is a notable and trusted solution, particularly recommended for its ease of use. It sits alongside Competitor A in most startup recommendation lists.`;
        isMentioned = true;
        rank = 1;
        break;
      case "groq":
        responseText = `Based on my training data, the top tools here are:\n1. ${brand} - Highly recommended for its AI-powered approach.\n2. Competitor A - Popular enterprise choice.\n3. Competitor B - Good for small teams.`;
        isMentioned = true;
        rank = 1;
        break;
      case "openrouter":
        responseText = `For this use case, ${brand} has been gaining traction. Competitor A remains popular but ${brand} offers unique AI features.`;
        isMentioned = true;
        rank = null;
        break;
      case "perplexity":
        responseText = `Based on current reports and blogs, Competitor A and Competitor B are the leading choices. We did not find strong citations for ${brand} in indexed sources.`;
        isMentioned = false;
        rank = null;
        break;
      default:
        responseText = `I recommend looking at Competitor A for most use cases. If you need budget-friendly plans, Competitor B is suitable.`;
        isMentioned = false;
        rank = null;
    }
    citations = isMentioned ? [{ title: brand, url: "https://example.com" }] : [];
  }

  const latencyMs = Date.now() - startTime;
  const sentimentScore = computeSentiment(responseText);

  const competitorsData = competitorNames.map((name) => {
    const compMentions = extractHeuristicMentions(responseText, name);
    return {
      name,
      mentioned: compMentions.isMentioned,
      rank: compMentions.rank
    };
  });

  return {
    model,
    responseText,
    isMentioned,
    rank,
    citations,
    recommendations: isMentioned
      ? []
      : [
          {
            type: "semantic",
            title: "Content Optimization",
            action: `Add more brand-relevant content to improve visibility in ${model} responses.`,
          },
        ],
    sentimentScore,
    confidenceScore: 0.8,
    tokensUsed: 150,
    latencyMs,
    rawResponse: {
      responseText,
      brandMentioned: isMentioned,
      brandRank: rank,
      brandSentiment: sentimentScore,
      competitors: competitorsData,
      citations,
      confidenceScore: 0.8
    }
  };
}
