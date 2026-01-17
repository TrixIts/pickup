-- Rollback for admin dashboard migration
-- Run this SQL in Supabase SQL Editor to undo admin-related changes

-- Drop policies first
DROP POLICY IF EXISTS "Admins can view all players" ON pickup_session_players;
DROP POLICY IF EXISTS "Admins can view all messages" ON session_messages;
DROP POLICY IF EXISTS "Admins can view all sessions" ON pickup_sessions;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop index
DROP INDEX IF EXISTS idx_profiles_is_admin;

-- Remove column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
