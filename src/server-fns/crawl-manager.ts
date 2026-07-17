import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../integrations/supabase/client.server";
const supabase = supabaseAdmin as any;
import { CrawlOrchestrator } from "../crawler/orchestrator";
import { CrawlJobStatus } from "../crawler/types";

// In a real app, this would be triggered via BullMQ or similar.
// For now, we'll kick it off asynchronously and return the job ID.
async function executeCrawlBackground(jobId: string, projectId: string, startUrl: string) {
  try {
    // Mark as running
    await supabase.from('crawl_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', jobId);
    
    // Run the crawl
    const job = { id: jobId, project_id: projectId, status: 'running' as CrawlJobStatus, crawl_type: 'seo', config: {} };
    const ctx = await CrawlOrchestrator.runCrawl(job, startUrl);
    
    // Persist Pages
    for (const page of ctx.pages) {
      const { error: pageError, data: pageData } = await supabase.from('crawl_pages').insert({
        job_id: jobId,
        url: page.url,
        depth: page.depth,
        page_data: page as any,
        fetcher_used: 'cheerio' // Ideally tracked per page
      }).select().single();
      
      // Persist Issues for this page
      const pageIssues = ctx.issues.filter(i => i.title); // Simplification, need actual mapping if tracking per page
      if (pageData && pageIssues.length > 0) {
         // Insert issues (skipped full batching for brevity here)
         await supabase.from('crawl_issues').insert(
           pageIssues.map(i => ({
             job_id: jobId,
             page_id: pageData.id,
             analyzer: i.analyzer,
             severity: i.severity,
             type: i.type,
             title: i.title,
             description: i.description
           }))
         );
      }
    }
    
    // Aggregate Results
    const errorCount = ctx.issues.filter(i => i.severity === 'error').length;
    const warningCount = ctx.issues.filter(i => i.severity === 'warning').length;
    const healthScore = Math.max(0, 100 - (errorCount * 10) - (warningCount * 3));
    
    await supabase.from('seo_audit_results').insert({
      job_id: jobId,
      project_id: projectId,
      health_score: healthScore,
      geo_score: 0,
      ai_visibility_score: 0,
      summary: {
        pages_crawled: ctx.pages.length,
        total_issues: ctx.issues.length
      }
    });

    // Mark as completed
    await supabase.from('crawl_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId);
    
  } catch (err: any) {
    await supabase.from('crawl_jobs').update({ status: 'failed', error: String(err.message || err), completed_at: new Date().toISOString() }).eq('id', jobId);
  }
}

export const startCrawlJob = createServerFn({ method: "POST" })
  .validator((data: { projectId: string, url: string }) => data)
  .handler(async ({ data: { projectId, url } }) => {
    // Insert new pending job
    const { data: job, error } = await supabase.from('crawl_jobs').insert({
      project_id: projectId,
      crawl_type: 'seo',
      status: 'pending'
    }).select().single();
    
    if (error || !job) {
      throw new Error("Failed to create crawl job: " + error?.message);
    }
    
    // Fire and forget (don't await)
    executeCrawlBackground(job.id, projectId, url).catch(console.error);
    
    return { jobId: job.id };
  });

export const getCrawlStatus = createServerFn({ method: "GET" })
  .validator((jobId: string) => jobId)
  .handler(async ({ data: jobId }) => {
    const { data: job, error } = await supabase.from('crawl_jobs').select('*').eq('id', jobId).single();
    if (error || !job) throw new Error("Job not found");
    
    let results = null;
    let issues = null;
    if (job.status === 'completed') {
      const res = await supabase.from('seo_audit_results').select('*').eq('job_id', jobId).single();
      results = res.data;
      
      const iss = await supabase.from('crawl_issues').select('*').eq('job_id', jobId);
      issues = iss.data;
    }
    
    return { job, results, issues };
  });
