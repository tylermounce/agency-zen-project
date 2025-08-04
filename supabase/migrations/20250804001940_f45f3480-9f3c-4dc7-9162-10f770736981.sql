-- Add mentions column to store array of mentioned user IDs
ALTER TABLE public.messages 
ADD COLUMN mentions TEXT[] DEFAULT '{}'::TEXT[];