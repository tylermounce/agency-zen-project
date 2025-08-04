-- Add notification_type column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN notification_type text NOT NULL DEFAULT 'message';