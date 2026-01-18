-- Rollback: Fix infinite recursion in profiles RLS policies
-- Created at: 2026-01-18

-- 1. Revert policies to the recursive version (original state before fix)
-- WARNING: This will re-introduce the infinite recursion issue if the is_admin column exists

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (auth.uid() = id) OR (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.is_admin = true))))
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    (auth.uid() = id) OR (EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.is_admin = true))))
  );

-- 2. Revert other admin policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.pickup_sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.pickup_sessions FOR SELECT
  USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.session_messages;
CREATE POLICY "Admins can view all messages"
  ON public.session_messages FOR SELECT
  USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

DROP POLICY IF EXISTS "Admins can view all players" ON public.pickup_session_players;
CREATE POLICY "Admins can view all players"
  ON public.pickup_session_players FOR SELECT
  USING (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

-- 3. Drop the function if no longer needed
-- DROP FUNCTION IF EXISTS public.is_admin();
