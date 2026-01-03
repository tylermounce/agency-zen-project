-- Enhance template_tasks table for better task generation
-- Adds relative due dates and default assignee

-- Add relative_due_days column (number of days from template application date)
-- e.g., 0 = same day, 1 = next day, 7 = one week later
ALTER TABLE public.template_tasks
ADD COLUMN IF NOT EXISTS relative_due_days INTEGER NOT NULL DEFAULT 0;

-- Add default_assignee_id column for direct user assignment
-- When applying template, if this user is not in the target workspace,
-- the system will prompt for a replacement
ALTER TABLE public.template_tasks
ADD COLUMN IF NOT EXISTS default_assignee_id UUID REFERENCES auth.users(id);

-- Add a comment explaining the columns
COMMENT ON COLUMN public.template_tasks.relative_due_days IS
  'Number of days after template application date that this task is due. 0 = same day.';

COMMENT ON COLUMN public.template_tasks.default_assignee_id IS
  'Default user to assign this task to. If user is not in target workspace, prompt for reassignment.';

-- Create index for faster queries by template
CREATE INDEX IF NOT EXISTS idx_template_tasks_template_id
ON public.template_tasks(template_id);

-- Create index for ordering tasks
CREATE INDEX IF NOT EXISTS idx_template_tasks_order
ON public.template_tasks(template_id, order_index);
