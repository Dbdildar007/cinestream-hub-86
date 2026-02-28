
-- Movie ratings table
CREATE TABLE public.movie_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings" ON public.movie_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ratings" ON public.movie_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.movie_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.movie_ratings FOR DELETE USING (auth.uid() = user_id);

-- Watch progress table (continue watching)
CREATE TABLE public.watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id text NOT NULL,
  current_time_sec double precision NOT NULL DEFAULT 0,
  duration_sec double precision NOT NULL DEFAULT 0,
  last_watched timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.watch_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.watch_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.watch_progress FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.movie_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_progress;
