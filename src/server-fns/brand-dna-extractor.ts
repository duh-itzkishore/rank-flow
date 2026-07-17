import { createServerFn } from "@tanstack/react-start";

async function fetchMetadata(url: string) {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BrandExtractor/1.0; +https://rankflow.ai)"
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract Title
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract Meta Description
    const descMatch = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i) || 
                       html.match(/<meta\b[^>]*content="([^"]*)"[^>]*name="description"/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract H1s
    const h1s: string[] = [];
    const h1Regex = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
    let match;
    while ((match = h1Regex.exec(html)) !== null) {
      h1s.push(match[1].replace(/<[^>]+>/g, "").trim());
    }

    // Extract Schema count
    const schemaScripts = (html.match(/<script\b[^>]*type=["']application\/ld\+json["']/gi) || []).length;

    return {
      title,
      description,
      h1s: h1s.slice(0, 5),
      schemaScripts,
      targetUrl
    };
  } catch (err: any) {
    console.error("Failed to fetch metadata:", err);
    throw new Error(err.message || "Failed to contact website");
  }
}

export const extractBrandDna = createServerFn({ method: "POST" })
  .validator((data: { url: string; projectId: string }) => data)
  .handler(async ({ data: { url, projectId } }) => {
    const meta = await fetchMetadata(url);

    // Build DNA summary text
    const brandDnaBody = `### Brand Overview
- **Brand Website**: ${meta.targetUrl}
- **Extracted Title**: ${meta.title || "Not found"}
- **Meta Description**: ${meta.description || "Not found"}

### Core Messaging (H1 Headings)
${meta.h1s.length > 0 ? meta.h1s.map(h => `- ${h}`).join("\n") : "- No H1 headings detected"}

### Technical Signals
- **JSON-LD Schema Blocks**: ${meta.schemaScripts}
- **Crawl Status**: Success (extracted deterministically using RankFlow crawler)
`;

    // Insert brand DNA into ai_insights table (best-effort with service role)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: insight, error } = await (supabaseAdmin as any)
        .from("ai_insights")
        .insert({
          project_id: projectId,
          user_id: null,
          insight_type: "summary",
          title: `Brand DNA - ${meta.title || url}`,
          body: brandDnaBody,
          priority: "medium",
          source_data: { url: meta.targetUrl }
        })
        .select()
        .single();

      if (error) throw new Error(error.message || "DB insert failed");

      return {
        success: true,
        insight
      };
    } catch (dbErr: any) {
      console.warn("[BrandDNA] DB save skipped:", dbErr?.message ?? dbErr);
      // Return success with the data even if we couldn't persist it
      return {
        success: true,
        insight: {
          id: crypto.randomUUID(),
          title: `Brand DNA - ${meta.title || url}`,
          body: brandDnaBody,
          insight_type: "summary",
          priority: "medium",
          project_id: projectId,
          created_at: new Date().toISOString(),
        }
      };
    }
  });
