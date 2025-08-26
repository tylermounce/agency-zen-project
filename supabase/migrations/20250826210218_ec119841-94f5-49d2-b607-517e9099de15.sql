-- Fix infinite recursion in workspace_members policy
-- Create a security definer function to check workspace membership without RLS recursion

-- First, create a function to check if a user is a workspace member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

-- Create a new policy that uses the security definer function
CREATE POLICY "Users can view members of their workspaces" 
ON public.workspace_members 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can view all workspace members
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Users can view members of workspaces they belong to (no recursion)
    public.is_workspace_member(auth.uid(), workspace_id)
  )
);