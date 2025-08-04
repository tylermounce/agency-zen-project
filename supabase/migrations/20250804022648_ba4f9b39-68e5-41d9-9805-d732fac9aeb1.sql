-- Add delete policy for notifications so users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE
  USING ((auth.uid())::text = (user_id)::text);