-- AI Insights generated per project/period
CREATE TABLE public.ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  insight_type    TEXT NOT NULL, -- 'summary' | 'recommendation' | 'risk' | 'growth_opportunity' | 'performance'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  priority        TEXT DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low'
  source_data     JSONB DEFAULT '{}', -- prompt_run_ids, models, dates that triggered this
  is_actioned     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Competitor Intelligence snapshots
CREATE TABLE public.competitor_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id       UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visibility_score    FLOAT,
  mention_count       INTEGER DEFAULT 0,
  avg_rank            FLOAT,
  sov_percent         FLOAT,  -- Share of Voice %
  top_prompts         JSONB DEFAULT '[]', -- prompts where they outrank us
  gap_keywords        JSONB DEFAULT '[]', -- keywords we're losing on
  sentiment_score     FLOAT,
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content Optimizer suggestions
CREATE TABLE public.content_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  prompt_run_id   UUID REFERENCES public.prompt_runs(id) ON DELETE SET NULL,
  suggestion_type TEXT NOT NULL, -- 'page_analysis' | 'missing_entity' | 'schema_optimization' | 'seo_llm' | 'content_gap'
  title           TEXT NOT NULL,
  action          TEXT NOT NULL,
  impact          TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
  is_implemented  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own insights" ON public.ai_insights FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_snapshots TO authenticated;
GRANT ALL ON public.competitor_snapshots TO service_role;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitor snapshots" ON public.competitor_snapshots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitors c
      WHERE c.id = competitor_snapshots.competitor_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitors c
      WHERE c.id = competitor_snapshots.competitor_id AND c.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_suggestions TO authenticated;
GRANT ALL ON public.content_suggestions TO service_role;
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own content suggestions" ON public.content_suggestions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = content_suggestions.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = content_suggestions.project_id AND p.user_id = auth.uid()
    )
  );
