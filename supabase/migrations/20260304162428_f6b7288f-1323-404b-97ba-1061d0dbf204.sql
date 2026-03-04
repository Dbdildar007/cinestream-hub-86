
-- Make ALL RLS policies permissive (drop restrictive, recreate as permissive)

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- watch_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.watch_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.watch_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.watch_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.watch_progress;
CREATE POLICY "Users can view their own progress" ON public.watch_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.watch_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.watch_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.watch_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- movies/seasons/episodes
DROP POLICY IF EXISTS "Movies are publicly readable" ON public.movies;
CREATE POLICY "Movies are publicly readable" ON public.movies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Seasons are publicly readable" ON public.seasons;
CREATE POLICY "Seasons are publicly readable" ON public.seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Episodes are publicly readable" ON public.episodes;
CREATE POLICY "Episodes are publicly readable" ON public.episodes FOR SELECT USING (true);

-- watchlist
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add to watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove from watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist" ON public.watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to watchlist" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from watchlist" ON public.watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- movie_ratings
DROP POLICY IF EXISTS "Users can view their own ratings" ON public.movie_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.movie_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.movie_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.movie_ratings;
CREATE POLICY "Users can view their own ratings" ON public.movie_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ratings" ON public.movie_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.movie_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.movie_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships addressed to them" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships addressed to them" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- watch_parties
DROP POLICY IF EXISTS "Users can view their watch parties" ON public.watch_parties;
DROP POLICY IF EXISTS "Users can create watch parties" ON public.watch_parties;
DROP POLICY IF EXISTS "Hosts can update their watch parties" ON public.watch_parties;
DROP POLICY IF EXISTS "Users can delete their watch parties" ON public.watch_parties;
CREATE POLICY "Users can view their watch parties" ON public.watch_parties FOR SELECT TO authenticated USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create watch parties" ON public.watch_parties FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their watch parties" ON public.watch_parties FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Users can delete their watch parties" ON public.watch_parties FOR DELETE TO authenticated USING (auth.uid() = host_id OR auth.uid() = friend_id);

-- watch_party_history
DROP POLICY IF EXISTS "Users can view their own party history" ON public.watch_party_history;
DROP POLICY IF EXISTS "Users can insert party history" ON public.watch_party_history;
DROP POLICY IF EXISTS "Users can update their party history" ON public.watch_party_history;
CREATE POLICY "Users can view their own party history" ON public.watch_party_history FOR SELECT TO authenticated USING (auth.uid() = host_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert party history" ON public.watch_party_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users can update their party history" ON public.watch_party_history FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- Create profile for existing user missing one
INSERT INTO public.profiles (user_id, display_name, unique_id)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', 'User'), 'CS-' || substr(id::text, 1, 8)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;
