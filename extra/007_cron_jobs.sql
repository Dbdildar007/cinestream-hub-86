-- ============================================================
-- CineStream Database Schema - Extensions & Cron Jobs
-- Generated: 2026-03-08
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job: Check movie reminders every 5 minutes
-- Calls the check-reminders edge function to notify users
-- when upcoming movies become available
SELECT cron.schedule(
  'check-movie-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/check-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
