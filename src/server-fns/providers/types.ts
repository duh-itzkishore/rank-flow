export interface ProviderRequest {
  model: string;
  promptText: string;
  brandName: string;
  apiKey: string | null;
  competitorNames: string[];
  systemPrompt: string;
}

export interface ProviderResult {
  responseText: string;
  isMentioned: boolean;
  rank: number | null;
  citations: Array<{ title: string; url: string }>;
  recommendations?: Array<{ type: string; title: string; action: string }>;
  sentimentScore: number;
  confidenceScore: number;
  tokensUsed: number;
  latencyMs: number;
  rawResponse?: any;
  competitorsData?: Array<{ name: string; mentioned: boolean; rank: number | null }>;
}
