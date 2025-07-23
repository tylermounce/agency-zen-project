-- Clear all mock data except workspaces
-- Clear messages first (they reference conversations)
DELETE FROM public.messages;

-- Clear conversations
DELETE FROM public.conversations;

-- Clear tasks
DELETE FROM public.tasks;

-- Clear projects
DELETE FROM public.projects;