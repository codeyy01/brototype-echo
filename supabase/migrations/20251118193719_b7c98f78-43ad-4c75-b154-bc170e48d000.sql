-- Drop the notification functions with CASCADE to automatically drop dependent triggers
DROP FUNCTION IF EXISTS public.notify_on_admin_response() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_status_change() CASCADE;

-- Drop the notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;