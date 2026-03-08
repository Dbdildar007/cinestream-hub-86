
ALTER TABLE public.watch_party_history 
  ADD COLUMN IF NOT EXISTS current_time_sec double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_sec double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS episode_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'movie';
