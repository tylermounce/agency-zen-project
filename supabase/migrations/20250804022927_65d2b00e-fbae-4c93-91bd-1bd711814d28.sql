-- Add performance indexes on notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications (workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_workspace ON public.notifications (user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_thread ON public.notifications (user_id, thread_id);

-- Add performance indexes on messages table
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON public.messages (workspace_id);