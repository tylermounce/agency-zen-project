-- Add parent_message_id column to support single-level replies
ALTER TABLE public.messages
ADD COLUMN parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE;

-- Create index for faster reply lookups
CREATE INDEX idx_messages_parent_message_id ON public.messages(parent_message_id);

-- Add comment
COMMENT ON COLUMN public.messages.parent_message_id IS 'References the parent message for single-level reply threading';
