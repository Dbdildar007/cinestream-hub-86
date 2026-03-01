
-- Create movies table
CREATE TABLE public.movies (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  genre TEXT[] NOT NULL DEFAULT '{}',
  category TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'English',
  description TEXT NOT NULL DEFAULT '',
  poster TEXT NOT NULL DEFAULT '',
  hero_image TEXT,
  url TEXT,
  newly_added TEXT,
  duration TEXT NOT NULL DEFAULT '',
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_editor_choice BOOLEAN NOT NULL DEFAULT false,
  is_series BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read access for movies
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movies are publicly readable" ON public.movies FOR SELECT USING (true);

-- Create watch party history table
CREATE TABLE public.watch_party_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  movie_id TEXT NOT NULL REFERENCES public.movies(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_watched_sec DOUBLE PRECISION NOT NULL DEFAULT 0
);

ALTER TABLE public.watch_party_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own party history" ON public.watch_party_history FOR SELECT USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert party history" ON public.watch_party_history FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update their party history" ON public.watch_party_history FOR UPDATE USING (auth.uid() = host_id);

-- Enable realtime for movies
ALTER PUBLICATION supabase_realtime ADD TABLE public.movies;
