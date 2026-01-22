-- Rollback: Remove reputation system tables and modifications
-- Run this to undo the reputation system migration

-- Drop triggers first
DROP TRIGGER IF EXISTS on_review_added ON public.player_reviews;
DROP TRIGGER IF EXISTS on_profile_created_stats ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_player_stats_on_review();
DROP FUNCTION IF EXISTS public.create_player_stats_for_new_profile();

-- Drop tables
DROP TABLE IF EXISTS public.player_reviews;
DROP TABLE IF EXISTS public.player_stats;

-- Remove added columns from pickup_session_players
ALTER TABLE public.pickup_session_players
DROP COLUMN IF EXISTS attended,
DROP COLUMN IF EXISTS checked_in_at;

-- Remove is_private from pickup_sessions
ALTER TABLE public.pickup_sessions
DROP COLUMN IF EXISTS is_private;
