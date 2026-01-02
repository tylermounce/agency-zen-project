-- Create task_comments table for timestamped notes on tasks
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view comments on tasks in workspaces they belong to
CREATE POLICY "Users can view task comments in their workspaces"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
      AND wm.user_id = auth.uid()
    )
  );

-- Users can create comments on tasks in workspaces they belong to
CREATE POLICY "Users can create task comments in their workspaces"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
      AND wm.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own task comments"
  ON public.task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own task comments"
  ON public.task_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.task_comments TO authenticated;
GRANT SELECT ON public.task_comments TO anon;
