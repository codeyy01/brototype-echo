-- Update notify_on_admin_response to prevent duplicate notifications
CREATE OR REPLACE FUNCTION public.notify_on_admin_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ticket_owner UUID;
  ticket_title TEXT;
  admin_user_id UUID;
  recent_notification_count INT;
BEGIN
  -- Get the ticket owner and title
  SELECT created_by, title INTO ticket_owner, ticket_title
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Get the admin's user_id
  admin_user_id := NEW.admin_id;

  -- Only create notification if:
  -- 1. The ticket owner is not the admin who responded (prevent self-notification)
  -- 2. No notification was created for this ticket in the last 2 seconds (prevent duplicates)
  IF ticket_owner != admin_user_id THEN
    SELECT COUNT(*) INTO recent_notification_count
    FROM public.notifications
    WHERE user_id = ticket_owner
      AND link LIKE '%ticketId=' || NEW.ticket_id || '%'
      AND created_at > NOW() - INTERVAL '2 seconds';
    
    IF recent_notification_count = 0 THEN
      INSERT INTO public.notifications (user_id, text, link)
      VALUES (
        ticket_owner,
        'An admin responded to your complaint "' || ticket_title || '"',
        '/my-complaints?ticketId=' || NEW.ticket_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Update notify_on_status_change to prevent duplicate notifications
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  status_text TEXT;
  recent_notification_count INT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if the user making the change is the ticket owner (prevent self-notification)
    IF NEW.created_by != auth.uid() OR auth.uid() IS NULL THEN
      -- Check for recent notifications for this ticket (prevent duplicates)
      SELECT COUNT(*) INTO recent_notification_count
      FROM public.notifications
      WHERE user_id = NEW.created_by
        AND link LIKE '%ticketId=' || NEW.id || '%'
        AND created_at > NOW() - INTERVAL '2 seconds';
      
      IF recent_notification_count = 0 THEN
        -- Format status text
        status_text := CASE NEW.status
          WHEN 'open' THEN 'Open'
          WHEN 'in_progress' THEN 'In Progress'
          WHEN 'resolved' THEN 'Resolved'
          ELSE NEW.status::TEXT
        END;

        INSERT INTO public.notifications (user_id, text, link)
        VALUES (
          NEW.created_by,
          'Your complaint "' || NEW.title || '" was marked as ' || status_text,
          '/my-complaints?ticketId=' || NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;