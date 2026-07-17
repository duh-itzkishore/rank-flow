-- Add prompt execution credit tracking to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS monthly_prompt_credits INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS used_prompt_credits INTEGER NOT NULL DEFAULT 0;

-- Optional: Reset credits on billing cycle (handled via cron/pg_cron in prod)
-- We just track used vs allowed.
