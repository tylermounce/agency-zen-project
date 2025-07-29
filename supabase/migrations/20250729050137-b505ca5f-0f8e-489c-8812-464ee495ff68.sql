-- Add missing fields to projects table
ALTER TABLE public.projects 
ADD COLUMN due_date DATE,
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN notes TEXT;

-- Create project_members table for team assignments
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_members
CREATE POLICY "Users can view project members in their workspaces"
ON public.project_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id 
      AND wm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage project members"
ON public.project_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));