-- Google Drive integration settings (organization-level)
CREATE TABLE IF NOT EXISTS public.google_drive_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- OAuth tokens (encrypted in practice, stored securely)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  -- The root "Agency Zen" folder ID in Google Drive
  root_folder_id TEXT,
  -- Connected Google account email for display
  connected_email TEXT,
  -- Connection status
  is_connected BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace folder mappings (links workspaces to their Drive folders)
CREATE TABLE IF NOT EXISTS public.workspace_drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  drive_folder_id TEXT NOT NULL,
  drive_folder_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id)
);

-- File attachments (references to files stored in Google Drive)
CREATE TABLE IF NOT EXISTS public.file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT, -- MIME type
  file_size INTEGER, -- in bytes
  -- Google Drive references
  drive_file_id TEXT NOT NULL,
  drive_file_url TEXT NOT NULL,
  drive_thumbnail_url TEXT,
  -- Context - what is this file attached to?
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  -- Who uploaded it
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- At least one context must be set
  CONSTRAINT file_must_have_context CHECK (
    workspace_id IS NOT NULL OR task_id IS NOT NULL OR comment_id IS NOT NULL
  )
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_file_attachments_workspace ON public.file_attachments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_task ON public.file_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_comment ON public.file_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_workspace_drive_folders_workspace ON public.workspace_drive_folders(workspace_id);

-- RLS policies
ALTER TABLE public.google_drive_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify Google Drive settings
CREATE POLICY "Admins can manage Google Drive settings"
  ON public.google_drive_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view workspace folder mappings for workspaces they're members of
CREATE POLICY "Users can view workspace drive folders"
  ON public.workspace_drive_folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_drive_folders.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Admins can manage workspace folder mappings
CREATE POLICY "Admins can manage workspace drive folders"
  ON public.workspace_drive_folders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view file attachments in their workspaces
CREATE POLICY "Users can view file attachments in their workspaces"
  ON public.file_attachments
  FOR SELECT
  USING (
    -- Direct workspace attachment
    (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = file_attachments.workspace_id
      AND user_id = auth.uid()
    ))
    OR
    -- Task attachment - check task's workspace
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = file_attachments.task_id
      AND wm.user_id = auth.uid()
    ))
    OR
    -- Comment attachment - check comment's task's workspace
    (comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.task_comments tc
      JOIN public.tasks t ON t.id = tc.task_id
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE tc.id = file_attachments.comment_id
      AND wm.user_id = auth.uid()
    ))
  );

-- Users can create file attachments in their workspaces
CREATE POLICY "Users can create file attachments"
  ON public.file_attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      -- Direct workspace attachment
      (workspace_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = file_attachments.workspace_id
        AND user_id = auth.uid()
      ))
      OR
      -- Task attachment
      (task_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
        WHERE t.id = file_attachments.task_id
        AND wm.user_id = auth.uid()
      ))
      OR
      -- Comment attachment
      (comment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.task_comments tc
        JOIN public.tasks t ON t.id = tc.task_id
        JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
        WHERE tc.id = file_attachments.comment_id
        AND wm.user_id = auth.uid()
      ))
    )
  );

-- Users can delete their own attachments, admins can delete any
CREATE POLICY "Users can delete own attachments"
  ON public.file_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
