-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  link TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Trigger Function: Notify student when admin responds
CREATE OR REPLACE FUNCTION public.notify_on_admin_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_owner UUID;
  ticket_title TEXT;
BEGIN
  -- Get the ticket owner and title
  SELECT created_by, title INTO ticket_owner, ticket_title
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Create notification for the ticket owner
  INSERT INTO public.notifications (user_id, text, link)
  VALUES (
    ticket_owner,
    'An admin responded to your complaint "' || ticket_title || '"',
    '/my-complaints?ticketId=' || NEW.ticket_id
  );

  RETURN NEW;
END;
$$;

-- Create trigger on admin_responses
CREATE TRIGGER trigger_notify_on_admin_response
AFTER INSERT ON public.admin_responses
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_admin_response();

-- Trigger Function: Notify student when ticket status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_text TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Format status text
    status_text := CASE NEW.status
      WHEN 'open' THEN 'Open'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'resolved' THEN 'Resolved'
      ELSE NEW.status::TEXT
    END;

    -- Create notification for the ticket owner
    INSERT INTO public.notifications (user_id, text, link)
    VALUES (
      NEW.created_by,
      'Your complaint "' || NEW.title || '" was marked as ' || status_text,
      '/my-complaints?ticketId=' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on tickets
CREATE TRIGGER trigger_notify_on_status_change
AFTER UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_status_change();