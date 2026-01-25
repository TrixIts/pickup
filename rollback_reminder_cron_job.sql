-- Rollback: Remove session reminders cron job
-- Run this to undo the setup_reminder_cron_job.sql

-- Remove the cron job
SELECT cron.unschedule('send-session-reminders-daily');

-- Verify it was removed
SELECT * FROM cron.job WHERE jobname LIKE '%reminder%';

-- Note: This does NOT disable the pg_cron or pg_net extensions
-- as other features might depend on them
