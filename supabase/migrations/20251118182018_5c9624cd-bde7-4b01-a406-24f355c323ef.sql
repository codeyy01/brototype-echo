-- Update the notify_on_admin_response function to prevent self-notifications
CREATE OR REPLACE FUNCTION public.notify_on_admin_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_owner UUID;
  ticket_title TEXT;
  admin_user_id UUID;
BEGIN
  -- Get the ticket owner and title
  SELECT created_by, title INTO ticket_owner, ticket_title
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Get the admin's user_id from admin_responses
  admin_user_id := NEW.admin_id;

  -- Only create notification if the ticket owner is not the admin who responded
  -- This prevents self-notification
  IF ticket_owner != admin_user_id THEN
    INSERT INTO public.notifications (user_id, text, link)
    VALUES (
      ticket_owner,
      'An admin responded to your complaint "' || ticket_title || '"',
      '/my-complaints?ticketId=' || NEW.ticket_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Update the notify_on_status_change function to prevent self-notifications
-- and check if user is admin to avoid duplicate notifications
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_text TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if the user making the change is the ticket owner
    -- If so, don't notify them
    IF NEW.created_by != auth.uid() OR auth.uid() IS NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$;