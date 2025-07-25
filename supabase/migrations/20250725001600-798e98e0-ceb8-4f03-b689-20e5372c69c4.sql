-- Clear all mock data except workspaces
-- Clear messages first (they reference conversations)
DELETE FROM public.messages;

-- Clear conversations
DELETE FROM public.conversations;

-- Clear tasks
DELETE FROM public.tasks;

-- Clear projects
DELETE FROM public.projects;

-- Clear project templates and template tasks
DELETE FROM public.template_tasks;
DELETE FROM public.project_templates;