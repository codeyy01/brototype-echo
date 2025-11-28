-- Create the missing trigger to automatically assign roles to new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill roles for existing users based on admin whitelist
DO $$
DECLARE
  admin_whitelist TEXT[] := ARRAY['admin1@brototype.com', 'cto@brototype.com', 'admin@brototype.com'];
  user_record RECORD;
  user_role app_role;
BEGIN
  -- Loop through all users in auth.users
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users
  LOOP
    -- Check if user already has a role
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_record.id) THEN
      -- Determine role based on admin whitelist
      IF user_record.email = ANY(admin_whitelist) THEN
        user_role := 'admin';
      ELSE
        user_role := 'student';
      END IF;
      
      -- Insert the role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (user_record.id, user_role);
      
      -- Also ensure profile exists
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_record.id) THEN
        INSERT INTO public.profiles (id, email, display_name)
        VALUES (
          user_record.id, 
          user_record.email,
          split_part(user_record.email, '@', 1)
        );
      END IF;
    END IF;
  END LOOP;
END $$;