-- Fix notification spam vulnerability by restricting notification creation

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a more restrictive policy that only allows:
-- 1. Users to create notifications for themselves
-- 2. System-generated notifications (through security definer functions)
CREATE POLICY "Users can only create notifications for themselves" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.uid())::text = (user_id)::text
);

-- Create a security definer function for legitimate cross-user notifications (like mentions)
CREATE OR REPLACE FUNCTION public.create_mention_notification(
  target_user_id uuid,
  p_message_id uuid,
  p_content text,
  p_sender_name text,
  p_thread_id text,
  p_thread_type text,
  p_workspace_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Verify the sender is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify the message exists and belongs to the sender
  IF NOT EXISTS (
    SELECT 1 FROM public.messages 
    WHERE id = p_message_id AND sender_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Message not found or access denied';
  END IF;
  
  -- Verify the target user is in the same conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.messages m ON m.thread_id = c.thread_id
    WHERE m.id = p_message_id 
    AND (target_user_id)::text = ANY(c.participants)
  ) THEN
    RAISE EXCEPTION 'Target user is not part of this conversation';
  END IF;
  
  -- Create the notification
  INSERT INTO public.notifications (
    user_id,
    message_id,
    content,
    sender_name,
    thread_id,
    thread_type,
    workspace_id,
    notification_type
  ) VALUES (
    target_user_id,
    p_message_id,
    p_content,
    p_sender_name,
    p_thread_id,
    p_thread_type,
    p_workspace_id,
    'mention'
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;