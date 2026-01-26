-- Revert security invoker setting (default is false)
ALTER VIEW public.session_attendance_summary RESET (security_invoker);

-- Disable RLS on backup table
ALTER TABLE public.backup_pickup_session_players_20260124 DISABLE ROW LEVEL SECURITY;
