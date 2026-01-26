-- Rollback: Disable RLS on tables where it was enabled
ALTER TABLE public.pickup_session_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages DISABLE ROW LEVEL SECURITY;

-- Rollback: Revert notification policy to original (permissive) state if needed, or just drop the strict one
-- Original was: Users can insert notifications using (true) with check (true)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- View rollback is not strictly necessary as the content is the same, just the permissions might have changed.
-- But we can leave it as is since standard view creation is fine.
