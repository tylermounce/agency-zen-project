-- Add is_archived column to workspaces for hiding without deleting
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient filtering of non-archived workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_is_archived ON public.workspaces(is_archived);

-- Comment on the column
COMMENT ON COLUMN public.workspaces.is_archived IS 'When true, workspace is hidden from main nav but data is preserved';
