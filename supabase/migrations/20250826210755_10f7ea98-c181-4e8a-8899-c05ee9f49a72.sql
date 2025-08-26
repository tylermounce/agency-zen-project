-- Allow authorized users to permanently delete tasks
-- Matches existing INSERT/UPDATE/SELECT permissions
CREATE POLICY IF NOT EXISTS "Users can delete tasks in their workspaces"
ON public.tasks
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id
        AND wm.user_id = auth.uid()
    )
  )
);