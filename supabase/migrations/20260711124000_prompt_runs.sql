-- Migration to create prompt_runs table for tracking AI model recommendations, ranks, and citation sources.
CREATE TABLE public.prompt_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  model TEXT NOT NULL, -- 'chatgpt', 'gemini', 'perplexity', 'claude'
  response_text TEXT NOT NULL,
  is_mentioned BOOLEAN NOT NULL DEFAULT false,
  rank INTEGER, -- Brand ranking inside the AI response list (if mentioned)
  citations JSONB DEFAULT '[]'::jsonb, -- Array of source URLs cited by the model
  recommendations JSONB DEFAULT '[]'::jsonb, -- Specific SEO/AEO actions to improve visibility for this prompt
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_runs TO authenticated;
GRANT ALL ON public.prompt_runs TO service_role;

ALTER TABLE public.prompt_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prompt runs" ON public.prompt_runs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = prompt_runs.prompt_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = prompt_runs.prompt_id AND p.user_id = auth.uid()
    )
  );
