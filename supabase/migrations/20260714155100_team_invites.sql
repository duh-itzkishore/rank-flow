CREATE TABLE public.team_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view invites for their orgs" ON public.team_invites FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = team_invites.org_id AND om.user_id = auth.uid())
);
CREATE POLICY "Admins insert invites" ON public.team_invites FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = team_invites.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
    AND invited_by = auth.uid()
);
CREATE POLICY "Admins delete invites" ON public.team_invites FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = team_invites.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);
