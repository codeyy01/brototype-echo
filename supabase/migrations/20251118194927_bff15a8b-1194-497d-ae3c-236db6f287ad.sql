-- Create enum for status types
CREATE TYPE public.status_type AS ENUM ('info', 'warning', 'critical');

-- Create global_status table
CREATE TABLE public.global_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  status_type status_type NOT NULL DEFAULT 'info',
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_status ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the global status
CREATE POLICY "Everyone can view global status"
ON public.global_status
FOR SELECT
USING (true);

-- Only admins can update global status
CREATE POLICY "Admins can update global status"
ON public.global_status
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert global status
CREATE POLICY "Admins can insert global status"
ON public.global_status
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_global_status_updated_at
BEFORE UPDATE ON public.global_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default status
INSERT INTO public.global_status (message, status_type, updated_by)
VALUES ('All Systems Operational', 'info', '00000000-0000-0000-0000-000000000000');