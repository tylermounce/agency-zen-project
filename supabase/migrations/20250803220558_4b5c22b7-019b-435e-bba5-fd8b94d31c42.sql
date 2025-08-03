-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  thread_id TEXT NOT NULL,
  thread_type TEXT NOT NULL,
  workspace_id TEXT,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create message_attachments table
CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on message_attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for message_attachments
CREATE POLICY "Users can view attachments in their conversations" 
ON public.message_attachments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM messages m 
  JOIN conversations c ON c.thread_id = m.thread_id 
  WHERE m.id = message_attachments.message_id 
  AND auth.uid()::text = ANY(c.participants)
));

CREATE POLICY "Users can create attachments for their messages" 
ON public.message_attachments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM messages m 
  WHERE m.id = message_attachments.message_id 
  AND m.sender_id = auth.uid()
));

-- Create trigger for notifications updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();