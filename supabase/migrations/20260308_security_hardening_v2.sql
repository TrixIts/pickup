-- Security Hardening v2
-- 1. Ensure RLS is enabled on tables that may be missing it
-- 2. Restrict is_admin() from anon role
-- 3. Clean up backup tables from public schema

-- ============================================
-- 1. Enable RLS on tables that may be missing it
-- ============================================

-- sports: should be readable by everyone, but not writable by users
ALTER TABLE IF EXISTS sports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sports' AND policyname = 'Sports are readable by everyone'
  ) THEN
    CREATE POLICY "Sports are readable by everyone" ON sports FOR SELECT USING (true);
  END IF;
END $$;

-- sport_skills: readable by authenticated users only
ALTER TABLE IF EXISTS sport_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sport_skills' AND policyname = 'Sport skills are readable by authenticated users'
  ) THEN
    CREATE POLICY "Sport skills are readable by authenticated users" ON sport_skills
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sport_skills' AND policyname = 'Users can manage their own sport skills'
  ) THEN
    CREATE POLICY "Users can manage their own sport skills" ON sport_skills
      FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
  END IF;
END $$;

-- push_subscriptions: users can only access their own subscriptions
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Users can manage their own push subscriptions'
  ) THEN
    CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 2. Restrict is_admin() from anon role
-- ============================================

-- Revoke execute from anon so unauthenticated users cannot call it
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- ============================================
-- 3. Drop backup tables from public schema
-- ============================================

DROP TABLE IF EXISTS public.backup_pickup_sessions_20260124;
DROP TABLE IF EXISTS public.backup_pickup_session_players_20260124;
