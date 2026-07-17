import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const AUTOCOMPLETE_SUFFIXES = [
  "",
  " for",
  " vs",
  " best",
  " how to",
  " without",
  " free",
  " alternative",
  " comparison",
  " review",
  " is",
  " can",
  " why",
];

async function googleSuggest(query: string, gl = "us", hl = "en"): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    client: "firefox",
    gl,
    hl,
  });
  const url = `https://www.google.com/complete/search?${params}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (!res.ok) return [];
    const parsed = await res.json();
    return (parsed[1] || []).map((s: any) => typeof s === "string" ? s : String(s));
  } catch {
    return [];
  }
}

export const exploreKeywords = createServerFn({ method: "POST" })
  .validator((data: { seeds: string[]; projectId: string; depth?: "quick" | "normal" | "deep" }) => data)
  .handler(async ({ data: { seeds, projectId, depth = "normal" } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const suffixes = depth === "quick"
      ? AUTOCOMPLETE_SUFFIXES.slice(0, 5)
      : depth === "deep"
        ? AUTOCOMPLETE_SUFFIXES
        : AUTOCOMPLETE_SUFFIXES.slice(0, 9);

    const allSuggestions = new Map<string, { keyword: string; source: string; seed: string }>();

    for (const seed of seeds) {
      for (const suffix of suffixes) {
        const query = seed + suffix;
        const suggestions = await googleSuggest(query);
        for (const s of suggestions) {
          if (!allSuggestions.has(s.toLowerCase())) {
            allSuggestions.set(s.toLowerCase(), {
              keyword: s,
              source: suffix ? `autocomplete${suffix}` : "autocomplete",
              seed,
            });
          }
        }
      }

      if (depth === "deep") {
        for (const letter of "abcdefghijklmnopqrstuvwxyz") {
          const query = `${seed} ${letter}`;
          const suggestions = await googleSuggest(query);
          for (const s of suggestions) {
            if (!allSuggestions.has(s.toLowerCase())) {
              allSuggestions.set(s.toLowerCase(), {
                keyword: s,
                source: "autocomplete-alpha",
                seed,
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      keywords: [...allSuggestions.values()]
    };
  });

export const saveKeywordsAsPrompts = createServerFn({ method: "POST" })
  .validator((data: { keywords: string[]; projectId: string }) => data)
  .handler(async ({ data: { keywords, projectId } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (keywords.length === 0) return { success: true };

    const insertRows = keywords.map(kw => ({
      project_id: projectId,
      user_id: user.id,
      text: kw,
      status: "active"
    }));

    const { error } = await supabase.from("prompts").insert(insertRows);
    if (error) throw error;

    return { success: true };
  });
