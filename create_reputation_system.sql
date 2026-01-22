-- Migration: Create player reviews table and add attendance tracking
-- Created at: 2026-01-21

-- 1. Create player_reviews table
CREATE TABLE public.player_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pickup_sessions(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- One review per pair per session
    UNIQUE(session_id, reviewer_id, reviewed_id),
    
    -- Can't review yourself
    CHECK (reviewer_id != reviewed_id)
);

-- 2. Create player_stats table for aggregated lookups
CREATE TABLE public.player_stats (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    games_joined INTEGER DEFAULT 0,
    games_attended INTEGER DEFAULT 0,
    reliability_pct DECIMAL(5,2) DEFAULT 100.00,
    avg_vibe_rating DECIMAL(3,2) DEFAULT 4.00,  -- Bayesian prior
    total_reviews INTEGER DEFAULT 0,
    positive_tags JSONB DEFAULT '{}',
    negative_tags JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add attendance tracking to pickup_session_players
ALTER TABLE public.pickup_session_players
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- 4. Add is_private flag to pickup_sessions for future private games
ALTER TABLE public.pickup_sessions
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.player_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- player_reviews policies
-- Anyone can read reviews (transparency)
CREATE POLICY "Reviews are viewable by everyone"
    ON public.player_reviews FOR SELECT
    USING (true);

-- Only insert if both reviewer and reviewed were in the same session
CREATE POLICY "Can only review players from same session"
    ON public.player_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM public.pickup_session_players psp1
            WHERE psp1.session_id = player_reviews.session_id
            AND psp1.profile_id = reviewer_id
        )
        AND EXISTS (
            SELECT 1 FROM public.pickup_session_players psp2
            WHERE psp2.session_id = player_reviews.session_id
            AND psp2.profile_id = reviewed_id
        )
    );

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.player_reviews FOR DELETE
    USING (auth.uid() = reviewer_id);

-- player_stats policies
-- Anyone can read stats
CREATE POLICY "Stats are viewable by everyone"
    ON public.player_stats FOR SELECT
    USING (true);

-- Only the system/triggers should update stats (use service role)
-- Users cannot directly modify stats
CREATE POLICY "Users can insert their own stats"
    ON public.player_stats FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- ============================================
-- TRIGGER: Auto-create player_stats on profile creation
-- ============================================
CREATE OR REPLACE FUNCTION public.create_player_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.player_stats (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_stats ON public.profiles;
CREATE TRIGGER on_profile_created_stats
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_player_stats_for_new_profile();

-- ============================================
-- TRIGGER: Update player_stats when review is added
-- ============================================
CREATE OR REPLACE FUNCTION public.update_player_stats_on_review()
RETURNS TRIGGER AS $$
DECLARE
    bayesian_prior DECIMAL := 4.0;
    prior_weight INTEGER := 3;  -- Weight of prior (as if 3 reviews at 4.0)
    current_sum DECIMAL;
    current_count INTEGER;
    new_avg DECIMAL;
BEGIN
    -- Get current stats
    SELECT total_reviews, avg_vibe_rating * total_reviews
    INTO current_count, current_sum
    FROM public.player_stats
    WHERE profile_id = NEW.reviewed_id;
    
    IF current_count IS NULL THEN
        current_count := 0;
        current_sum := 0;
    END IF;
    
    -- Calculate Bayesian average
    new_avg := (current_sum + NEW.rating + (bayesian_prior * prior_weight)) / 
               (current_count + 1 + prior_weight);
    
    -- Update stats
    UPDATE public.player_stats
    SET 
        avg_vibe_rating = ROUND(new_avg, 2),
        total_reviews = current_count + 1,
        updated_at = now()
    WHERE profile_id = NEW.reviewed_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_added ON public.player_reviews;
CREATE TRIGGER on_review_added
    AFTER INSERT ON public.player_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_player_stats_on_review();

-- ============================================
-- Initialize player_stats for existing profiles
-- ============================================
INSERT INTO public.player_stats (profile_id)
SELECT id FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;
