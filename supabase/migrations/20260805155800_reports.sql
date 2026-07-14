CREATE TABLE public.report_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  format          TEXT NOT NULL DEFAULT 'pdf', -- 'pdf' | 'csv' | 'email_digest'
  frequency       TEXT NOT NULL DEFAULT 'weekly', -- 'daily' | 'weekly' | 'monthly'
  recipients      TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_templates TO authenticated;
GRANT ALL ON public.report_templates TO service_role;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own report templates" ON public.report_templates FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
