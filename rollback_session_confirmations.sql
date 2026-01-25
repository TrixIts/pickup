-- Rollback: session_confirmations table
-- Run this to undo the create_session_confirmations.sql migration

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_create_session_confirmation ON public.pickup_session_players;

-- Drop the trigger function
DROP FUNCTION IF EXISTS create_session_confirmation();

-- Drop the view
DROP VIEW IF EXISTS public.session_attendance_summary;

-- Drop the timestamp update trigger
DROP TRIGGER IF EXISTS trigger_update_session_confirmation_timestamp ON public.session_confirmations;
DROP FUNCTION IF EXISTS update_session_confirmation_timestamp();

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view confirmations for their sessions" ON public.session_confirmations;
DROP POLICY IF EXISTS "Users can manage their own confirmations" ON public.session_confirmations;
DROP POLICY IF EXISTS "Hosts can view confirmations for their sessions" ON public.session_confirmations;

-- Drop indexes
DROP INDEX IF EXISTS idx_session_confirmations_session;
DROP INDEX IF EXISTS idx_session_confirmations_profile;
DROP INDEX IF EXISTS idx_session_confirmations_status;
DROP INDEX IF EXISTS idx_session_confirmations_reminder;

-- Drop the table
DROP TABLE IF EXISTS public.session_confirmations;

-- Drop the enum type
DROP TYPE IF EXISTS confirmation_status;
