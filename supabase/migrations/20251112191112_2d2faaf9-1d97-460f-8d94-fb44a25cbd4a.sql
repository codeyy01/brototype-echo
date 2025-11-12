-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved');

-- Create enum for ticket severity
CREATE TYPE public.ticket_severity AS ENUM ('low', 'medium', 'critical');

-- Create enum for ticket category
CREATE TYPE public.ticket_category AS ENUM ('academic', 'infrastructure', 'other');

-- Create enum for ticket visibility
CREATE TYPE public.ticket_visibility AS ENUM ('private', 'public');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  severity ticket_severity NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  visibility ticket_visibility NOT NULL DEFAULT 'private',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attachment_url TEXT,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create upvotes table (for tracking who upvoted)
CREATE TABLE public.ticket_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, user_id)
);

ALTER TABLE public.ticket_upvotes ENABLE ROW LEVEL SECURITY;

-- Create admin_responses table
CREATE TABLE public.admin_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_responses ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Storage policies for ticket attachments
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ticket-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Only system can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- RLS Policies for tickets
CREATE POLICY "Students can view their own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Students can view public tickets"
ON public.tickets FOR SELECT
USING (visibility = 'public');

CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_upvotes
CREATE POLICY "Users can view all upvotes"
ON public.ticket_upvotes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own upvotes"
ON public.ticket_upvotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes"
ON public.ticket_upvotes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for admin_responses
CREATE POLICY "Everyone can view admin responses"
ON public.admin_responses FOR SELECT
USING (true);

CREATE POLICY "Admins can create responses"
ON public.admin_responses FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_whitelist TEXT[] := ARRAY['admin1@brototype.com', 'cto@brototype.com', 'admin@brototype.com'];
  user_role app_role;
BEGIN
  -- Check if email is in admin whitelist
  IF NEW.email = ANY(admin_whitelist) THEN
    user_role := 'admin';
  ELSE
    user_role := 'student';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update ticket upvote count
CREATE OR REPLACE FUNCTION public.update_ticket_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Trigger to update upvote count
CREATE TRIGGER update_upvote_count_trigger
  AFTER INSERT OR DELETE ON public.ticket_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_upvote_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updating tickets timestamp
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();