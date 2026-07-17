-- ============================================================
-- FIX: Infinite recursion in org_members RLS policies
-- Error: 42P17 - infinite recursion detected in policy for relation "org_members"
--
-- ROOT CAUSE: The org_members SELECT policy queried org_members from within
-- itself, creating infinite recursion whenever Postgres evaluated the policy.
--
-- FIX: Use SECURITY DEFINER functions that bypass RLS to break the cycle.
-- ============================================================

-- Step 1: Create helper functions with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(org_id), '{}')
  FROM public.org_members
  WHERE user_id = auth.uid()
    AND status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = target_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
$$;

-- Step 2: Drop ALL existing org_members policies
DROP POLICY IF EXISTS "Users view org members in their orgs" ON public.org_members;
DROP POLICY IF EXISTS "Admins update org members" ON public.org_members;
DROP POLICY IF EXISTS "Admins insert org members" ON public.org_members;
DROP POLICY IF EXISTS "Users can insert their own org member row on org creation" ON public.org_members;
DROP POLICY IF EXISTS "Admins delete org members" ON public.org_members;

-- Step 3: Recreate all policies using SECURITY DEFINER functions (no self-reference)

CREATE POLICY "Users view org members in their orgs"
  ON public.org_members FOR SELECT TO authenticated
  USING (org_id = ANY(public.get_auth_user_org_ids()));

CREATE POLICY "Admins update org members"
  ON public.org_members FOR UPDATE TO authenticated
  USING (public.is_org_admin(org_id));

CREATE POLICY "Insert org members"
  ON public.org_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_org_admin(org_id)
  );

CREATE POLICY "Admins delete org members"
  ON public.org_members FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

-- Step 4: Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.get_auth_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
