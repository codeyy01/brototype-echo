-- Allow students to update their own tickets
CREATE POLICY "Students can update their own tickets"
ON public.tickets
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);