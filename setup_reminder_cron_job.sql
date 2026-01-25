-- pg_cron setup for session reminders
-- This runs the send-session-reminders Edge Function daily at 9 AM UTC
-- 
-- IMPORTANT: You need to enable pg_cron extension in your Supabase project first:
-- Dashboard -> Database -> Extensions -> Search "pg_cron" -> Enable

-- 1. First, enable the pg_cron and pg_net extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Grant cron schema usage to postgres (may already be granted)
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Create the cron job to call the Edge Function daily at 9 AM UTC
-- This will trigger the send-session-reminders function

-- First, remove any existing job with this name
SELECT cron.unschedule('send-session-reminders-daily');

-- Create the new job
-- Runs at 9:00 AM UTC every day (adjust as needed)
-- Uses pg_net to make an HTTP request to the Edge Function
SELECT cron.schedule(
    'send-session-reminders-daily',    -- Job name
    '0 9 * * *',                        -- Cron expression: 9 AM UTC daily
    $$
    SELECT net.http_post(
        url := 'https://kqmxhfgbxohhenwjtvon.supabase.co/functions/v1/send-session-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
            'x-cron-secret', current_setting('app.settings.cron_secret', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 4. Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'send-session-reminders-daily';

-- 5. To test the job manually (optional):
-- SELECT cron.schedule('test-reminder-now', '* * * * *', $$ ... $$);
-- Then unschedule after testing: SELECT cron.unschedule('test-reminder-now');

-- NOTE: You'll need to set these app settings in your Supabase project:
-- Dashboard -> Settings -> Database -> App Settings
-- Or use the SQL below with your actual keys:

-- Example (replace with your actual keys):
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
-- ALTER DATABASE postgres SET app.settings.cron_secret = 'your-cron-secret';
