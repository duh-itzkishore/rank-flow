import { ProviderRequest, ProviderResult } from "./types";

export async function queryPerplexity(req: ProviderRequest, parseResponse: Function): Promise<ProviderResult> {
  const startTime = Date.now();
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.promptText },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Perplexity error ${res.status}`);

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
