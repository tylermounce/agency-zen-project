-- Make project_id nullable to allow standalone workspace tasks
ALTER TABLE public.tasks 
ALTER COLUMN project_id DROP NOT NULL;

-- Update the task creation policy to allow tasks without project_id
DROP POLICY IF EXISTS "Users can create tasks in their workspaces" ON public.tasks;

CREATE POLICY "Users can create tasks in their workspaces" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   (EXISTS ( 
     SELECT 1 
     FROM workspace_members wm 
     WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
   )))
);