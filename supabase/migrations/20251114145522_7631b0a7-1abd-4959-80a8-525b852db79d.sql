-- Make ticket-attachments bucket private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'ticket-attachments';

-- Add RLS policies for storage.objects to control access to attachments

-- Policy: Students can upload attachments to their own folder
CREATE POLICY "Students can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Students can view attachments on their own tickets
CREATE POLICY "Students can view own ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' 
  AND (
    -- User owns the folder (their own uploads)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- OR user owns a ticket that references this attachment
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.created_by = auth.uid()
      AND tickets.attachment_url LIKE '%' || name || '%'
    )
    OR
    -- OR it's attached to a public ticket
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.visibility = 'public'
      AND tickets.attachment_url LIKE '%' || name || '%'
    )
  )
);

-- Policy: Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix function search_path issue for update_ticket_upvote_count
CREATE OR REPLACE FUNCTION public.update_ticket_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tickets
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tickets
    SET upvote_count = upvote_count - 1
    WHERE id = OLD.ticket_id;
  END IF;
  RETURN NULL;
END;
$function$;