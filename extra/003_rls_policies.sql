-- ============================================================
-- CineStream Database Schema - Row Level Security Policies
-- Generated: 2026-03-08
-- ============================================================

-- ============================================================
-- MOVIES (public read-only)
-- ============================================================
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movies are publicly readable"
  ON public.movies FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- SEASONS (public read-only)
-- ============================================================
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons are publicly readable"
  ON public.seasons FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- EPISODES (public read-only)
-- ============================================================
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Episodes are publicly readable"
  ON public.episodes FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING ((auth.uid() = requester_id) OR (auth.uid() = addressee_id));

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships addressed to them"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING ((auth.uid() = requester_id) OR (auth.uid() = addressee_id));

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE POLICY "Users can send chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update chat messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Senders can edit their own chat messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

-- ============================================================
-- MESSAGE REACTIONS
-- ============================================================
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their messages"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_messages cm
    WHERE cm.id = message_reactions.message_id
    AND (cm.sender_id = auth.uid() OR cm.receiver_id = auth.uid())
  ));

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- CALL MESSAGES
-- ============================================================
ALTER TABLE public.call_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.call_messages FOR SELECT
  TO authenticated
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE POLICY "Users can send messages"
  ON public.call_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages"
  ON public.call_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages"
  ON public.call_messages FOR DELETE
  TO authenticated
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- MOVIE RATINGS
-- ============================================================
ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
  ON public.movie_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON public.movie_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.movie_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.movie_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- MOVIE REMINDERS
-- ============================================================
ALTER TABLE public.movie_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
  ON public.movie_reminders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- WATCHLIST
-- ============================================================
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist"
  ON public.watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from watchlist"
  ON public.watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- WATCH PROGRESS
-- ============================================================
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.watch_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- WATCH PARTIES
-- ============================================================
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their watch parties"
  ON public.watch_parties FOR SELECT
  TO authenticated
  USING ((auth.uid() = host_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can create watch parties"
  ON public.watch_parties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their watch parties"
  ON public.watch_parties FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their watch parties"
  ON public.watch_parties FOR DELETE
  TO authenticated
  USING ((auth.uid() = host_id) OR (auth.uid() = friend_id));

-- ============================================================
-- WATCH PARTY HISTORY
-- ============================================================
ALTER TABLE public.watch_party_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own party history"
  ON public.watch_party_history FOR SELECT
  TO authenticated
  USING ((auth.uid() = host_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can insert party history"
  ON public.watch_party_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their party history"
  ON public.watch_party_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);
