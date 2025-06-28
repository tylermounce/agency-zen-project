
-- Create a table to store messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  thread_type TEXT NOT NULL CHECK (thread_type IN ('dm', 'project', 'channel')),
  thread_id TEXT NOT NULL,
  workspace_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table to store conversation threads
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id TEXT NOT NULL UNIQUE,
  thread_type TEXT NOT NULL CHECK (thread_type IN ('dm', 'project', 'channel')),
  title TEXT NOT NULL,
  workspace_id TEXT,
  participants TEXT[] NOT NULL DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.thread_id = messages.thread_id 
      AND auth.uid()::text = ANY(c.participants)
    )
  );

CREATE POLICY "Users can insert messages in their conversations" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.thread_id = messages.thread_id 
      AND auth.uid()::text = ANY(c.participants)
    )
  );

-- Create policies for conversations
CREATE POLICY "Users can view their conversations" 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can create conversations they participate in" 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can update their conversations" 
  ON public.conversations 
  FOR UPDATE 
  USING (auth.uid()::text = ANY(participants));
