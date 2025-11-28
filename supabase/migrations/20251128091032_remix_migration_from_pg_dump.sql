CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'student'
);


--
-- Name: status_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_type AS ENUM (
    'info',
    'warning',
    'critical'
);


--
-- Name: ticket_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_category AS ENUM (
    'academic',
    'infrastructure',
    'other'
);


--
-- Name: ticket_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_severity AS ENUM (
    'low',
    'medium',
    'critical'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


--
-- Name: ticket_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_visibility AS ENUM (
    'private',
    'public'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_ticket_upvote_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ticket_upvote_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid NOT NULL,
    action text NOT NULL,
    target_ticket_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_upvotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_upvotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    severity public.ticket_severity NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    visibility public.ticket_visibility DEFAULT 'private'::public.ticket_visibility NOT NULL,
    created_by uuid NOT NULL,
    attachment_url text,
    upvote_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_responses admin_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_responses
    ADD CONSTRAINT admin_responses_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: ticket_upvotes ticket_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_upvotes
    ADD CONSTRAINT ticket_upvotes_pkey PRIMARY KEY (id);


--
-- Name: ticket_upvotes ticket_upvotes_ticket_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_upvotes
    ADD CONSTRAINT ticket_upvotes_ticket_id_user_id_key UNIQUE (ticket_id, user_id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: tickets update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ticket_upvotes update_upvote_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_upvote_count_trigger AFTER INSERT OR DELETE ON public.ticket_upvotes FOR EACH ROW EXECUTE FUNCTION public.update_ticket_upvote_count();


--
-- Name: admin_responses admin_responses_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_responses
    ADD CONSTRAINT admin_responses_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_responses admin_responses_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_responses
    ADD CONSTRAINT admin_responses_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_target_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_target_ticket_id_fkey FOREIGN KEY (target_ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ticket_upvotes ticket_upvotes_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_upvotes
    ADD CONSTRAINT ticket_upvotes_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_upvotes ticket_upvotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_upvotes
    ADD CONSTRAINT ticket_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs Admins can create audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_responses Admins can create responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create responses" ON public.admin_responses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tickets Admins can update tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tickets" ON public.tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_responses Everyone can view admin responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view admin responses" ON public.admin_responses FOR SELECT USING (true);


--
-- Name: user_roles Only system can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only system can insert roles" ON public.user_roles FOR INSERT WITH CHECK (false);


--
-- Name: tickets Students can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can create tickets" ON public.tickets FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: tickets Students can delete their own open tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own open tickets" ON public.tickets FOR DELETE TO authenticated USING (((auth.uid() = created_by) AND (status = 'open'::public.ticket_status)));


--
-- Name: tickets Students can update their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own tickets" ON public.tickets FOR UPDATE USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: tickets Students can view public tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view public tickets" ON public.tickets FOR SELECT USING ((visibility = 'public'::public.ticket_visibility));


--
-- Name: tickets Students can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own tickets" ON public.tickets FOR SELECT USING ((auth.uid() = created_by));


--
-- Name: ticket_upvotes Users can delete their own upvotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own upvotes" ON public.ticket_upvotes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ticket_upvotes Users can insert their own upvotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own upvotes" ON public.ticket_upvotes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: user_roles Users can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);


--
-- Name: ticket_upvotes Users can view all upvotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all upvotes" ON public.ticket_upvotes FOR SELECT USING (true);


--
-- Name: admin_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_upvotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_upvotes ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


