import { ProviderRequest, ProviderResult } from "./types";

export async function queryAnthropic(req: ProviderRequest, parseResponse: Function): Promise<ProviderResult> {
  const startTime = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": req.apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1536,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.promptText }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Anthropic error ${res.status}`);

  const rawText = data.content?.[0]?.text || "";
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  const latencyMs = Date.now() - startTime;

  const parsed = parseResponse(rawText, req.brandName, req.competitorNames);
  return {
    ...parsed,
    tokensUsed,
    latencyMs,
    rawResponse: data,
  };
}
