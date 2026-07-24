import { ProviderRequest, ProviderResult } from "./types";

export async function queryGemini(req: ProviderRequest, parseResponse: Function): Promise<ProviderResult> {
  const startTime = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${req.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: req.systemPrompt }] },
        contents: [{ parts: [{ text: req.promptText }] }],
        generationConfig: {
          maxOutputTokens: 1536,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini error ${res.status}`);

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
  const latencyMs = Date.now() - startTime;

  const parsed = parseResponse(rawText, req.brandName, req.competitorNames);
  return {
    ...parsed,
    tokensUsed,
    latencyMs,
    rawResponse: data,
  };
}
