-- Fix critical security issue: Remove public access to workspace_members table
-- and restrict access to workspace members only

-- Drop the overly permissive policy that allows anyone to view workspace members
DROP POLICY IF EXISTS "Anyone can view workspace members" ON public.workspace_members;

-- Create a secure policy that only allows users to view members of workspaces they belong to
CREATE POLICY "Users can view members of their workspaces" 
ON public.workspace_members 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can view all workspace members
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can only view members of workspaces they belong to
    EXISTS (
      SELECT 1 
      FROM public.workspace_members wm 
      WHERE wm.workspace_id = workspace_members.workspace_id 
      AND wm.user_id = auth.uid()
    )
  )
);