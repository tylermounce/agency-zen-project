-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

-- Create policies for message attachments
CREATE POLICY "Anyone can view message attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);