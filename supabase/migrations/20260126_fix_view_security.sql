-- Force security invoker on the view to ensure RLS is respected
ALTER VIEW public.session_attendance_summary SET (security_invoker = true);

-- Enable RLS on the backup table just to be safe and clear the advisor warning
ALTER TABLE public.backup_pickup_session_players_20260124 ENABLE ROW LEVEL SECURITY;
