-- ============================================================
-- Migration: Prompt Journeys and Multimodal Widget Tracking
-- ============================================================

-- 1. Create prompt_journeys table
CREATE TABLE public.prompt_journeys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_journeys TO authenticated;
GRANT ALL ON public.prompt_journeys TO service_role;
ALTER TABLE public.prompt_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prompt_journeys" ON public.prompt_journeys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_prompt_journeys_updated BEFORE UPDATE ON public.prompt_journeys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Update prompts table
ALTER TABLE public.prompts 
ADD COLUMN journey_id UUID REFERENCES public.prompt_journeys(id) ON DELETE CASCADE,
ADD COLUMN parent_prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE;

-- 3. Update prompt_runs for Multimodal tracking
ALTER TABLE public.prompt_runs
ADD COLUMN media_embeds JSONB DEFAULT '[]'::jsonb;
