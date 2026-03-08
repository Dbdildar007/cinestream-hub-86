-- ============================================================
-- CineStream Database Schema - Table Definitions
-- Generated: 2026-03-08
-- ============================================================

-- ============================================================
-- 1. MOVIES TABLE (unified movies + series)
-- ============================================================
CREATE TABLE public.movies (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'English',
  description TEXT NOT NULL DEFAULT '',
  poster TEXT NOT NULL DEFAULT '',
  hero_image TEXT,
  url TEXT,
  duration TEXT NOT NULL DEFAULT '',
  genre TEXT[] NOT NULL DEFAULT '{}',
  category TEXT[] NOT NULL DEFAULT '{}',
  newly_added TEXT,
  upcoming_date TIMESTAMP WITH TIME ZONE,
  is_series BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_editor_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. SEASONS TABLE
-- ============================================================
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (series_id, season_number),
  CONSTRAINT seasons_movie_id_fkey FOREIGN KEY (series_id) REFERENCES public.movies(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. EPISODES TABLE
-- ============================================================
CREATE TABLE public.episodes (
  id TEXT NOT NULL PRIMARY KEY,
  season_id UUID NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT episodes_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  unique_id TEXT NOT NULL UNIQUE DEFAULT ('CS-' || substr((gen_random_uuid())::text, 1, 8)),
  avatar_url TEXT,
  location TEXT DEFAULT '',
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active_session_id TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. FRIENDSHIPS TABLE
-- ============================================================
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

-- ============================================================
-- 6. CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id)
);

-- ============================================================
-- 7. MESSAGE REACTIONS TABLE
-- ============================================================
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji),
  CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. CALL MESSAGES TABLE
-- ============================================================
CREATE TABLE public.call_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. MOVIE RATINGS TABLE
-- ============================================================
CREATE TABLE public.movie_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

-- ============================================================
-- 11. MOVIE REMINDERS TABLE
-- ============================================================
CREATE TABLE public.movie_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

-- ============================================================
-- 12. WATCHLIST TABLE
-- ============================================================
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

-- ============================================================
-- 13. WATCH PROGRESS TABLE
-- ============================================================
CREATE TABLE public.watch_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  episode_id TEXT,
  media_type TEXT DEFAULT 'movie',
  current_time_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_watched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id),
  UNIQUE (user_id, movie_id, episode_id)
);

-- ============================================================
-- 14. WATCH PARTIES TABLE
-- ============================================================
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  episode_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_playing BOOLEAN NOT NULL DEFAULT false,
  current_time_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. WATCH PARTY HISTORY TABLE
-- ============================================================
CREATE TABLE public.watch_party_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  episode_id TEXT,
  media_type TEXT DEFAULT 'movie',
  current_time_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_watched_sec DOUBLE PRECISION NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT watch_party_history_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id)
);
