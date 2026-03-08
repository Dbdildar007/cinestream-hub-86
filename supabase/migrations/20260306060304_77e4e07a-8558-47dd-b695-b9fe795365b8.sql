
ALTER TABLE public.watch_progress 
  ADD COLUMN IF NOT EXISTS episode_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'movie';

-- Drop old unique constraint if exists, then add new one
DO $$ BEGIN
  -- Try dropping any existing unique constraint on user_id, movie_id
  BEGIN
    ALTER TABLE public.watch_progress DROP CONSTRAINT IF EXISTS watch_progress_user_id_movie_id_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS watch_progress_user_movie_episode_idx 
  ON public.watch_progress (user_id, movie_id, COALESCE(episode_id, ''));
