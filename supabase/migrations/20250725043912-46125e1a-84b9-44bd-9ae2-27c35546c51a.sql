-- Add RLS policies for messages UPDATE and DELETE operations

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);