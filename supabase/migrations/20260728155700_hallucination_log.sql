ALTER TABLE public.prompt_runs
  ADD COLUMN hallucination_detected BOOLEAN DEFAULT false,
  ADD COLUMN hallucination_details  JSONB DEFAULT '{}'; -- {pattern, excerpt, severity}
