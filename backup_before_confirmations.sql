-- BACKUP SCRIPT: Run this BEFORE the migration
-- Generated: 2026-01-24
-- Purpose: Create backup of current state before adding session_confirmations

-- 1. First, check current table counts (for reference)
SELECT 
    'pickup_sessions' as table_name, 
    COUNT(*) as row_count 
FROM public.pickup_sessions
UNION ALL
SELECT 
    'pickup_session_players' as table_name, 
    COUNT(*) as row_count 
FROM public.pickup_session_players;

-- 2. Create backup tables (copies of current data)
CREATE TABLE IF NOT EXISTS public.backup_pickup_sessions_20260124 AS 
SELECT * FROM public.pickup_sessions;

CREATE TABLE IF NOT EXISTS public.backup_pickup_session_players_20260124 AS 
SELECT * FROM public.pickup_session_players;

-- 3. Verify backups were created
SELECT 
    'backup_pickup_sessions_20260124' as backup_table, 
    COUNT(*) as row_count 
FROM public.backup_pickup_sessions_20260124
UNION ALL
SELECT 
    'backup_pickup_session_players_20260124' as backup_table, 
    COUNT(*) as row_count 
FROM public.backup_pickup_session_players_20260124;

-- Done! You can now safely run create_session_confirmations.sql
-- To restore from backup if needed:
-- DROP TABLE public.pickup_sessions;
-- CREATE TABLE public.pickup_sessions AS SELECT * FROM public.backup_pickup_sessions_20260124;
-- (Then recreate constraints, indexes, RLS, etc.)
