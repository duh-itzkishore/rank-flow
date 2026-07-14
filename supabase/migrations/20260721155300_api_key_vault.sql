-- Org-level AI provider keys
CREATE TABLE public.api_key_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL, -- 'openai' | 'anthropic' | 'google' | 'perplexity'
  encrypted_key TEXT NOT NULL, -- encrypted key string
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_key_configs TO authenticated;
GRANT ALL ON public.api_key_configs TO service_role;
ALTER TABLE public.api_key_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own api configs" ON public.api_key_configs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = api_key_configs.org_id AND org_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = api_key_configs.org_id AND org_members.user_id = auth.uid()
    )
  );
