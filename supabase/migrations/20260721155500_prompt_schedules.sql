CREATE TABLE public.prompt_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id   UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  frequency   TEXT NOT NULL, -- 'daily' | 'weekly' | 'manual'
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_schedules TO authenticated;
GRANT ALL ON public.prompt_schedules TO service_role;
ALTER TABLE public.prompt_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedules" ON public.prompt_schedules FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
