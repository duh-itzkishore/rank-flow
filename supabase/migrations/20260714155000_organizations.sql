-- Organizations (workspaces, multi-tenant root)
CREATE TABLE public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id),
  plan        TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Members
CREATE TABLE public.org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member' | 'viewer'
  invited_by  UUID REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'active', -- 'invited' | 'active'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Assignments (projects scoped to org)
ALTER TABLE public.projects ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view organizations they belong to" ON public.organizations FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = organizations.id AND org_members.user_id = auth.uid())
);
CREATE POLICY "Users update their own organizations" ON public.organizations FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = organizations.id AND org_members.user_id = auth.uid() AND org_members.role IN ('owner', 'admin'))
);
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());


GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view org members in their orgs" ON public.org_members FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid())
);
CREATE POLICY "Admins update org members" ON public.org_members FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);
CREATE POLICY "Admins insert org members" ON public.org_members FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);
CREATE POLICY "Users can insert their own org member row on org creation" ON public.org_members FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND status = 'active'
);
CREATE POLICY "Admins delete org members" ON public.org_members FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);


-- Update handle_new_user to create a personal org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id UUID;
  user_full_name TEXT;
  org_slug TEXT;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Create personal org
  org_slug := lower(regexp_replace(user_full_name, '\W+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (user_full_name || '''s Workspace', org_slug, NEW.id)
  RETURNING id INTO new_org_id;

  INSERT INTO public.org_members (org_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');

  RETURN NEW;
END; $$;
