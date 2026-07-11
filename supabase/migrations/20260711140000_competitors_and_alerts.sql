-- ============================================================
-- Migration: competitors, alerts, llms_txt_configs tables
-- ============================================================

-- 1. Competitors Table
CREATE TABLE public.competitors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  domain      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitors TO authenticated;
GRANT ALL ON public.competitors TO service_role;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own competitors" ON public.competitors FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Alerts Table
CREATE TABLE public.alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  project_id     UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_run_id  UUID REFERENCES public.prompt_runs(id) ON DELETE SET NULL,
  type           TEXT NOT NULL, -- 'rank_drop' | 'hallucination' | 'competitor_surge' | 'citation_lost' | 'rank_gain'
  severity       TEXT NOT NULL DEFAULT 'info', -- 'success' | 'warning' | 'danger' | 'info'
  message        TEXT NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT false,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.alerts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. LLMs.txt Config Table
CREATE TABLE public.llms_txt_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  user_id       UUID NOT NULL,
  content       TEXT,
  focus_topics  TEXT[] DEFAULT '{}',
  last_updated  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.llms_txt_configs TO authenticated;
GRANT ALL ON public.llms_txt_configs TO service_role;
ALTER TABLE public.llms_txt_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own llms configs" ON public.llms_txt_configs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
