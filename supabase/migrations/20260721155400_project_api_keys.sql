-- Drop old org-level AI provider keys table
DROP TABLE IF EXISTS public.api_key_configs CASCADE;

-- Create project-level AI provider keys table
CREATE TABLE public.api_key_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL, -- 'openai' | 'anthropic' | 'gemini' | 'perplexity'
  encrypted_key TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_key_configs TO authenticated;
GRANT ALL ON public.api_key_configs TO service_role;
ALTER TABLE public.api_key_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own project api configs" ON public.api_key_configs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.org_members om ON om.org_id = p.org_id
      WHERE p.id = api_key_configs.project_id AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.org_members om ON om.org_id = p.org_id
      WHERE p.id = api_key_configs.project_id AND om.user_id = auth.uid()
    )
  );
