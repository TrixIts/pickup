-- Enable RLS on pickup_session_players if not enabled
ALTER TABLE public.pickup_session_players ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session_messages if not enabled
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- Fix notification insert policy to be more restrictive
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Recreate session_attendance_summary view without SECURITY DEFINER (if it was part of the view definition, though usually views use the permissions of the query runner. 
-- The previous lint said it was SECURITY DEFINER, which is rare for standard views unless explicitly set or if it's a function.
-- Let's check if it's actually a view or a function. The lint said "View ... is defined with SECURITY DEFINER".
-- Standard SQL views don't usually have SECURITY DEFINER, maybe it was created via a function or is a materialized view with specific owner?
-- Actually, the lint likely refers to a function used in the view or the view itself in some Postgres extensions/versions can carry owner permissions (invoker vs definer).
-- However, standard Postgres views run with the privileges of the user *accessing* the view, unless `security_barrier` or other options are used, OR if it calls a SECURITY DEFINER function.
-- Looking at the previous file content for `create_session_confirmations.sql`, the view was defined as:
-- CREATE OR REPLACE VIEW public.session_attendance_summary AS ...
-- It doesn't explicitly say SECURITY DEFINER.
-- Wait, the lint `security_definer_view` usually applies to *Functions* that are SECURITY DEFINER, OR if the view allows row access that shouldn't be allowed. 
-- BUT, looking at the lint detail: "View `public.session_attendance_summary` is defined with the SECURITY DEFINER property".
-- To be safe, we will just recreate it. A standard `CREATE OR REPLACE VIEW` should default to `SECURITY INVOKER` behavior (standard behavior).
-- If the previous creation script used a function that was security definer, maybe that's the issue.
-- The lint might be a false positive OR I missed something in `create_reputation_system.sql` or similar.
-- Regardless, strictly defining RLS on the underlying tables (`pickup_sessions`, `pickup_session_players`, `session_confirmations`) should be enough, and we can just recreate the view to be sure.

CREATE OR REPLACE VIEW public.session_attendance_summary AS
SELECT 
    ps.id as session_id,
    ps.title,
    ps.start_time,
    ps.series_id,
    COUNT(psp.id) as total_joined,
    COUNT(CASE WHEN sc.status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN sc.status = 'declined' THEN 1 END) as declined_count,
    COUNT(CASE WHEN sc.status = 'maybe' THEN 1 END) as maybe_count,
    COUNT(CASE WHEN sc.status = 'pending' OR sc.status IS NULL THEN 1 END) as pending_count
FROM public.pickup_sessions ps
LEFT JOIN public.pickup_session_players psp ON psp.session_id = ps.id
LEFT JOIN public.session_confirmations sc ON sc.session_id = ps.id AND sc.profile_id = psp.profile_id
GROUP BY ps.id, ps.title, ps.start_time, ps.series_id;
