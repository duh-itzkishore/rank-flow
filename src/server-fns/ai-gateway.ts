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

// Shared system prompt for all models
const SYSTEM_PROMPT = `You are an objective AI assistant that helps users find information about brands and products.
When asked for recommendations or comparisons, provide a numbered list of options.
Be factual, concise, and mention specific brands by name if they are relevant.`;

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
    return getSimulatedFallback(model, promptText, brandName, startTime);
  }

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
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
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
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
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
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
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
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
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
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptText },
          ],
          max_tokens: 1024,
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
          // meta-llama/llama-3.2-3b-instruct:free is always free on OpenRouter
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptText },
          ],
          max_tokens: 1024,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `OpenRouter error ${res.status}`);
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;
    }

    const latencyMs = Date.now() - startTime;
    const { isMentioned, rank } = extractHeuristicMentions(responseText, brandName);
    const sentimentScore = computeSentiment(responseText);

    // Extract citation links from markdown URLs in response
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
      recommendations: isMentioned
        ? []
        : [
            {
              type: "content_gap",
              title: "Visibility Action Item",
              action: `Optimize your page content around terms matching this prompt to improve ${model} visibility.`,
            },
          ],
      sentimentScore,
      confidenceScore: 0.9,
      tokensUsed,
      latencyMs,
    };
  } catch (err) {
    console.error(`Error fetching real API for ${model}:`, err);
    return getSimulatedFallback(model, promptText, brandName, startTime);
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

function getSimulatedFallback(model: string, _promptText: string, brandName: string, startTime: number): ModelResponse {
  const brand = brandName || "Your Brand";
  let responseText = "";
  let isMentioned = false;
  let rank: number | null = null;

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

  const latencyMs = Date.now() - startTime;
  const sentimentScore = computeSentiment(responseText);

  return {
    model,
    responseText,
    isMentioned,
    rank,
    citations: isMentioned ? [{ title: brand, url: "https://example.com" }] : [],
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
  };
}
