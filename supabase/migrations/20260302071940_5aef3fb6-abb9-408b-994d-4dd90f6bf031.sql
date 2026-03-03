
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT DEFAULT 'User',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Create movie_ratings table
CREATE TABLE public.movie_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ratings" ON public.movie_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ratings" ON public.movie_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.movie_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Create watch_parties table
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  is_playing BOOLEAN NOT NULL DEFAULT true,
  current_time_sec NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own parties" ON public.watch_parties FOR SELECT USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create parties" ON public.watch_parties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update own parties" ON public.watch_parties FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete own parties" ON public.watch_parties FOR DELETE USING (auth.uid() = host_id);

-- Create watch_party_history table
CREATE TABLE public.watch_party_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  duration_watched_sec NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.watch_party_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON public.watch_party_history FOR SELECT USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert history" ON public.watch_party_history FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Enable realtime for watch_parties and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
