-- Migration: Create leagues table
-- Created at: 2026-01-19

CREATE TABLE public.leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    description TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view leagues (Discovery)
CREATE POLICY "Leagues are viewable by everyone"
    ON public.leagues FOR SELECT
    USING (true);

-- 2. Authenticated users can create leagues
CREATE POLICY "Users can create their own leagues"
    ON public.leagues FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 3. Owners can update their own leagues
CREATE POLICY "Owners can update their own leagues"
    ON public.leagues FOR UPDATE
    USING (auth.uid() = owner_id);

-- 4. Owners can delete their own leagues
CREATE POLICY "Owners can delete their own leagues"
    ON public.leagues FOR DELETE
    USING (auth.uid() = owner_id);
