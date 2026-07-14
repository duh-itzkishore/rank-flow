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
    // Look for list items: e.g. "1. BrandName", "2) BrandName"
    const lines = text.split("\n");
    let listCount = 0;
    for (const line of lines) {
      if (/^\s*\d+[\.\)]\s+/.test(line)) {
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
  const positiveWords = ["best", "great", "excellent", "lead", "top", "outstanding", "value", "recommend", "prefer"];
  const negativeWords = ["poor", "bad", "expensive", "slow", "lack", "fail", "difficult", "limit", "issue", "risk"];
  
  const normalized = text.toLowerCase();
  let score = 0;
  positiveWords.forEach(w => { if (normalized.includes(w)) score += 0.25; });
  negativeWords.forEach(w => { if (normalized.includes(w)) score -= 0.25; });
  
  return Math.max(-1, Math.min(1, score));
}

// General query model function
export async function queryAIModel(
  model: string, 
  promptText: string, 
  brandName: string, 
  apiKey: string | null
): Promise<ModelResponse> {
  const startTime = Date.now();
  let responseText = "";
  let tokensUsed = 0;
  
  const actualKey = apiKey || getEnvKey(model);
  
  if (!actualKey) {
    // If no API key is provided, return a simulated response as a fallback gracefully
    return getSimulatedFallback(model, promptText, brandName, startTime);
  }

  try {
    if (model === "chatgpt") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an objective AI assistant. Provide recommendations. At the end, state if the brand is mentioned, its rank in any list (1-indexed, null if not in list), and citations." },
            { role: "user", content: promptText }
          ]
        })
      });
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;
    } else if (model === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": actualKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [{ role: "user", content: promptText }]
        })
      });
      const data = await res.json();
      responseText = data.content?.[0]?.text || "";
      tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    } else if (model === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${actualKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      tokensUsed = 0; // Gemini doesn't always return token count simply in basic REST payload
    } else if (model === "perplexity") {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualKey}`
        },
        body: JSON.stringify({
          model: "llama-3-sonar-small-32k-online",
          messages: [{ role: "user", content: promptText }]
        })
      });
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;
    }

    const latencyMs = Date.now() - startTime;
    const { isMentioned, rank } = extractHeuristicMentions(responseText, brandName);
    const sentimentScore = computeSentiment(responseText);

    // Extract basic citation links from text (markdown URLs)
    const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    const citations: Array<{ title: string; url: string }> = [];
    let match;
    while ((match = urlRegex.exec(responseText)) !== null) {
      citations.push({ title: match[1], url: match[2] });
    }

    return {
      model,
      responseText,
      isMentioned,
      rank,
      citations,
      recommendations: isMentioned ? [] : [{
        type: "content_gap",
        title: "Visibility Action Item",
        action: `Optimize your page content around terms matching this prompt to be indexed by ${model}.`
      }],
      sentimentScore,
      confidenceScore: 0.9,
      tokensUsed,
      latencyMs
    };

  } catch (err) {
    console.error(`Error fetching real API for ${model}:`, err);
    return getSimulatedFallback(model, promptText, brandName, startTime);
  }
}

function getEnvKey(model: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  switch (model) {
    case "chatgpt": return process.env.OPENAI_API_KEY;
    case "claude": return process.env.CLAUDE_API_KEY;
    case "gemini": return process.env.GEMINI_API_KEY;
    case "perplexity": return process.env.PERPLEXITY_API_KEY;
    default: return undefined;
  }
}

function getSimulatedFallback(model: string, promptText: string, brandName: string, startTime: Date | number): ModelResponse {
  let responseText = "";
  let isMentioned = false;
  let rank: number | null = null;
  const brand = brandName || "Your Brand";

  if (model === "chatgpt") {
    responseText = `Here are some recommendations for products in this category:\n1. Competitor A - Best for enterprise scale.\n2. ${brand} - Great value and features for startups.\n3. Competitor B - Good all-rounder.`;
    isMentioned = true;
    rank = 2;
  } else if (model === "perplexity") {
    responseText = `Based on current reports and blogs, Competitor A and Competitor B are the leading choices in this space. We did not find strong citations for ${brand}.`;
    isMentioned = false;
    rank = null;
  } else if (model === "gemini") {
    responseText = `${brand} is a notable solution, particularly recommended for its ease of use. It sits alongside Competitor A in startup lists.`;
    isMentioned = true;
    rank = 1;
  } else {
    responseText = `I recommend looking at Competitor A for most use cases. If you need budget-friendly plans, Competitor B is suitable.`;
    isMentioned = false;
    rank = null;
  }

  const latencyMs = Date.now() - (startTime as number);
  const sentimentScore = computeSentiment(responseText);

  return {
    model,
    responseText,
    isMentioned,
    rank,
    citations: isMentioned ? [{ title: brand, url: "https://example.com" }] : [],
    recommendations: isMentioned ? [] : [{
      type: "semantic",
      title: "Content Optimization",
      action: `Include the key phrase "budget-friendly startup alternative" on your homepage.`
    }],
    sentimentScore,
    confidenceScore: 0.8,
    tokensUsed: 150,
    latencyMs
  };
}
