-- ============================================================
-- CineStream Database Schema - Realtime Subscriptions
-- Generated: 2026-03-08
-- ============================================================
-- These tables are enabled for Supabase Realtime (postgres_changes)

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movie_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
