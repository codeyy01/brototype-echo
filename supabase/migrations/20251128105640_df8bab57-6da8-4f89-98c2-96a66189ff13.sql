-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view ticket attachments
CREATE POLICY "Anyone can view ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- Allow users to update their own attachments
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);