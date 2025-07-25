-- CRITICAL SECURITY FIX: Fix Role Escalation Vulnerability
-- Remove overly permissive policies and implement proper access controls

-- 1. Fix user_roles table policies (CRITICAL)
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create secure policies for user_roles table
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles only" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Restrict profiles table access (MEDIUM)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their workspaces" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can see their own profile
    auth.uid() = id OR
    -- Users can see profiles of people in their workspaces
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    ) OR
    -- Admins can see all profiles
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 3. Improve workspace access controls
DROP POLICY IF EXISTS "Anyone can view workspaces" ON public.workspaces;

CREATE POLICY "Users can view workspaces they are members of" 
ON public.workspaces 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can see all workspaces
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can see workspaces they are members of
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  )
);

-- 4. Improve project access controls
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;

CREATE POLICY "Users can view projects in their workspaces" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can see all projects
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can see projects in workspaces they are members of
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  )
);

-- 5. Improve task access controls
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;

CREATE POLICY "Users can view tasks in their workspaces" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can see all tasks
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can see tasks assigned to them
    assignee_id = auth.uid() OR
    -- Users can see tasks in workspaces they are members of
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  )
);

-- Update task modification policies to be workspace-aware
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;

CREATE POLICY "Users can create tasks in their workspaces" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update tasks in their workspaces" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  )
);

-- 6. Restrict project template access to workspace members
DROP POLICY IF EXISTS "Anyone can view project templates" ON public.project_templates;

CREATE POLICY "Users can view project templates in their workspaces" 
ON public.project_templates 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Global templates (no workspace_id) are visible to all authenticated users
    workspace_id IS NULL OR
    -- Admins can see all templates
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can see templates in workspaces they are members of
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = project_templates.workspace_id AND wm.user_id = auth.uid()
    )
  )
);

-- 7. Restrict template tasks access
DROP POLICY IF EXISTS "Anyone can view template tasks" ON public.template_tasks;

CREATE POLICY "Users can view template tasks for accessible templates" 
ON public.template_tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.project_templates pt
      LEFT JOIN public.workspace_members wm ON wm.workspace_id = pt.workspace_id
      WHERE pt.id = template_tasks.template_id AND (
        pt.workspace_id IS NULL OR
        wm.user_id = auth.uid()
      )
    )
  )
);