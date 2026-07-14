ALTER TABLE public.prompt_runs
  ADD COLUMN sentiment_score  FLOAT DEFAULT 0,    -- -1 (negative) to 1 (positive)
  ADD COLUMN confidence_score FLOAT DEFAULT 1,    -- AI response confidence
  ADD COLUMN raw_response     JSONB DEFAULT '{}', -- full API response for debugging
  ADD COLUMN tokens_used      INTEGER DEFAULT 0,  -- cost tracking
  ADD COLUMN latency_ms       INTEGER DEFAULT 0;  -- response time
