import { ProviderRequest, ProviderResult } from "./types";
import { queryOpenAI } from "./openai";
import { queryAnthropic } from "./anthropic";
import { queryGemini } from "./gemini";
import { queryPerplexity } from "./perplexity";
import { queryGroq } from "./groq";
import { queryOpenRouter } from "./openrouter";

export * from "./types";

export async function dispatchProviderQuery(
  model: string,
  req: ProviderRequest,
  parseResponse: Function
): Promise<ProviderResult> {
  switch (model.toLowerCase()) {
    case "chatgpt":
    case "openai":
      return queryOpenAI(req, parseResponse);

    case "claude":
    case "anthropic":
      return queryAnthropic(req, parseResponse);

    case "gemini":
    case "google":
      return queryGemini(req, parseResponse);

    case "perplexity":
      return queryPerplexity(req, parseResponse);

    case "groq":
      return queryGroq(req, parseResponse);

    case "openrouter":
      return queryOpenRouter(req, parseResponse);

    default:
      throw new Error(`Unsupported model provider: ${model}`);
  }
}
