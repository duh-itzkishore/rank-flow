import { ProviderRequest, ProviderResult } from "./types";

export async function queryOpenRouter(req: ProviderRequest, parseResponse: Function): Promise<ProviderResult> {
  const startTime = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.apiKey}`,
      "HTTP-Referer": "https://rankflow.app",
      "X-Title": "RankFlow AI Brand Monitor",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.promptText },
      ],
      max_tokens: 1536,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenRouter error ${res.status}`);

  const rawText = data.choices?.[0]?.message?.content || "";
  const tokensUsed = data.usage?.total_tokens || 0;
  const latencyMs = Date.now() - startTime;

  const parsed = parseResponse(rawText, req.brandName, req.competitorNames);
  return {
    ...parsed,
    tokensUsed,
    latencyMs,
    rawResponse: data,
  };
}
