-- Remove global_status from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.global_status;

-- Drop the global_status table
DROP TABLE IF EXISTS public.global_status;