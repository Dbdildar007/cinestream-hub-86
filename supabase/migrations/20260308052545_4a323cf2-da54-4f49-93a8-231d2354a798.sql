
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS active_session_id text NULL,
  ADD COLUMN IF NOT EXISTS device_info jsonb NULL DEFAULT '{}'::jsonb;
