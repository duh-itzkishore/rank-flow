import { supabase } from "./client";

// Orgs & Members
export const getOrgMembers = (orgId: string) => 
  (supabase as any).from('org_members').select('*, profiles(full_name, email, avatar_url)').eq('org_id', orgId);

export const getTeamInvites = (orgId: string) => 
  (supabase as any).from('team_invites').select('*').eq('org_id', orgId);

export const createTeamInvite = (inviteData: any) => 
  (supabase as any).from('team_invites').insert(inviteData).select().single();

export const removeOrgMember = (orgId: string, userId: string) => 
  (supabase as any).from('org_members').delete().eq('org_id', orgId).eq('user_id', userId);

export const getUserOrgs = (userId: string) => 
  (supabase as any).from('organizations').select('*, org_members!inner(role, status)').eq('org_members.user_id', userId);

// Projects
export const getProjects = (orgId: string) => 
  (supabase as any).from('projects').select('*').eq('org_id', orgId).order('name');

// User Settings
export const getUserSettings = (userId: string) =>
  (supabase as any).from('user_settings').select('*').eq('user_id', userId).single();

export const updateUserSettings = (userId: string, data: any) =>
  (supabase as any).from('user_settings').update(data).eq('user_id', userId);

// Prompts & Runs
export const getPrompts = (projectId: string) =>
  supabase.from('prompts').select('*').eq('project_id', projectId);

export const getPromptRuns = (promptId: string, limit = 50) => 
  supabase.from('prompt_runs').select('*').eq('prompt_id', promptId).order('created_at', { ascending: false }).limit(limit);

// Common Aggregations
export const getVisibilityTrend = async (userId: string) => {
  // Uses a custom RPC or complex query in a real scenario
  // For now we'll fetch recent runs and aggregate in memory for simplicity
  const { data: runs } = await supabase
    .from('prompt_runs')
    .select('created_at, is_mentioned, model, rank, prompts!inner(user_id)')
    .eq('prompts.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);
  
  return runs || [];
};
