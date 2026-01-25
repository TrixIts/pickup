-- Migration: Create session_confirmations table
-- This table tracks per-session attendance confirmation for recurring pickup games
-- Users can join a series (long-term membership) but confirm/decline individual sessions

-- Create confirmation status enum
DO $$ BEGIN
    CREATE TYPE confirmation_status AS ENUM ('pending', 'confirmed', 'declined', 'maybe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create session_confirmations table
CREATE TABLE IF NOT EXISTS public.session_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.pickup_sessions(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status confirmation_status DEFAULT 'pending' NOT NULL,
    confirmed_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Each user can only have one confirmation per session
    UNIQUE(session_id, profile_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_session_confirmations_session 
    ON public.session_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_confirmations_profile 
    ON public.session_confirmations(profile_id);
CREATE INDEX IF NOT EXISTS idx_session_confirmations_status 
    ON public.session_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_session_confirmations_reminder 
    ON public.session_confirmations(reminder_sent_at) WHERE reminder_sent_at IS NULL;

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_session_confirmation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_confirmation_timestamp ON public.session_confirmations;
CREATE TRIGGER trigger_update_session_confirmation_timestamp
    BEFORE UPDATE ON public.session_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_session_confirmation_timestamp();

-- Enable RLS
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view confirmations for sessions they're part of
CREATE POLICY "Users can view confirmations for their sessions"
    ON public.session_confirmations FOR SELECT
    USING (
        profile_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.pickup_session_players psp
            WHERE psp.session_id = session_confirmations.session_id
            AND psp.profile_id = auth.uid()
        )
    );

-- Users can manage their own confirmations
CREATE POLICY "Users can manage their own confirmations"
    ON public.session_confirmations FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Hosts can view all confirmations for their sessions
CREATE POLICY "Hosts can view confirmations for their sessions"
    ON public.session_confirmations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pickup_sessions ps
            WHERE ps.id = session_confirmations.session_id
            AND ps.host_id = auth.uid()
        )
    );

-- Function to auto-create confirmation records when a user joins a session
CREATE OR REPLACE FUNCTION create_session_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.session_confirmations (session_id, profile_id, status)
    VALUES (NEW.session_id, NEW.profile_id, 'pending')
    ON CONFLICT (session_id, profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_session_confirmation ON public.pickup_session_players;
CREATE TRIGGER trigger_create_session_confirmation
    AFTER INSERT ON public.pickup_session_players
    FOR EACH ROW
    EXECUTE FUNCTION create_session_confirmation();

-- Add a view to easily see session player counts with confirmation status
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

COMMENT ON TABLE public.session_confirmations IS 'Tracks per-session attendance confirmation for pickup games. Users join a series but confirm each session individually.';
