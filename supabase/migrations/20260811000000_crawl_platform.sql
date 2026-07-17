-- Crawl job tracking
CREATE TABLE public.crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  crawl_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-page normalized data
CREATE TABLE public.crawl_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  page_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetcher_used TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issues found by analyzers
CREATE TABLE public.crawl_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.crawl_pages(id) ON DELETE CASCADE,
  analyzer TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'error', 'warning', 'info', 'success'
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggregated results per job
CREATE TABLE public.seo_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL DEFAULT 0,
  geo_score INTEGER NOT NULL DEFAULT 0,
  ai_visibility_score INTEGER NOT NULL DEFAULT 0,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_results ENABLE ROW LEVEL SECURITY;

-- Job Policies
CREATE POLICY "Users can view jobs for their projects" ON public.crawl_jobs
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert jobs for their projects" ON public.crawl_jobs
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update jobs for their projects" ON public.crawl_jobs
  FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete jobs for their projects" ON public.crawl_jobs
  FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Page Policies
CREATE POLICY "Users can view pages for their jobs" ON public.crawl_pages
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT id FROM public.crawl_jobs WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert pages for their jobs" ON public.crawl_pages
  FOR INSERT TO authenticated
  WITH CHECK (job_id IN (SELECT id FROM public.crawl_jobs WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())));

-- Issues Policies
CREATE POLICY "Users can view issues for their jobs" ON public.crawl_issues
  FOR SELECT TO authenticated
  USING (job_id IN (SELECT id FROM public.crawl_jobs WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert issues for their jobs" ON public.crawl_issues
  FOR INSERT TO authenticated
  WITH CHECK (job_id IN (SELECT id FROM public.crawl_jobs WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())));

-- Results Policies
CREATE POLICY "Users can view audit results for their projects" ON public.seo_audit_results
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert audit results for their projects" ON public.seo_audit_results
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
