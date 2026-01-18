-- Migration: Fix infinite recursion in profiles RLS policies
-- Created at: 2026-01-18

-- 1. Create a security definer function to check admin status
-- This avoids the infinite recursion in RLS policies by bypassing RLS during the check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the previous problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 3. Create fixed policies using the security definer function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR is_admin()
  );

-- 4. Update other admin policies for consistency and performance
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.pickup_sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.pickup_sessions FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all messages" ON public.session_messages;
CREATE POLICY "Admins can view all messages"
  ON public.session_messages FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all players" ON public.pickup_session_players;
CREATE POLICY "Admins can view all players"
  ON public.pickup_session_players FOR SELECT
  USING (is_admin());
