-- Allow students to delete their own tickets that are in 'open' status
CREATE POLICY "Students can delete their own open tickets"
ON public.tickets
FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND status = 'open'::ticket_status);