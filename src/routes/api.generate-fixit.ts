import { createFileRoute } from "@tanstack/react-router";
import { queryAIModel } from "@/server-fns/ai-gateway";

// @ts-ignore - Temporary route tree generation sync
export const Route = createFileRoute("/api/generate-fixit")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { issueCode, url, title, description, brandName = "RankFlow User" } = body;

          if (!issueCode) {
            return new Response(JSON.stringify({ success: false, error: "issueCode is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          let promptText = "";
          let snippetTitle = "AI Generated Fix";

          switch (issueCode) {
            case "missing_llms_txt":
              snippetTitle = "Generated llms.txt File";
              promptText = `Generate a standard markdown llms.txt file for a website called "${brandName}" (URL: ${url}). Include a clear project summary, key section links, and guidance for AI web crawlers (like GPTBot, PerplexityBot, ClaudeBot). Keep it clean markdown.`;
              break;

            case "missing_schema":
              snippetTitle = "Generated JSON-LD Schema Markup";
              promptText = `Generate a valid JSON-LD schema script block for the website "${brandName}" at ${url}. Include Organization and WebSite schema. Return ONLY valid <script type="application/ld+json">...</script> code block.`;
              break;

            case "missing_meta_description":
              snippetTitle = "Optimized Meta Description Options";
              promptText = `Generate 3 high-converting, GEO-optimized meta description options (under 160 characters each) for ${brandName} at ${url}.`;
              break;

            case "missing_h1":
            case "missing_page_title":
              snippetTitle = "GEO-Optimized Title & H1 Tags";
              promptText = `Generate 3 strong, keyword-rich H1 and Title tag pairings for ${brandName} at ${url} optimized for AI search visibility.`;
              break;

            default:
              snippetTitle = "AI Content Optimization Fix";
              promptText = `Provide an actionable SEO/AEO fix for the issue: "${title} - ${description}" for website ${url} of brand ${brandName}. Return clean Markdown format.`;
          }

          // Use Gemini / OpenAI via AI Gateway (falls back to simulated or configured env keys cleanly)
          const result = await queryAIModel("gemini", promptText, brandName, null, []);
          
          return new Response(
            JSON.stringify({
              success: true,
              issueCode,
              snippetTitle,
              snippetCode: result.responseText || "Could not generate fix.",
              instructions: "Copy and paste this snippet directly into your site root or HTML header."
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("Generate Fixit API Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
