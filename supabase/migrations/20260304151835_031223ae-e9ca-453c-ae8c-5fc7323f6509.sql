
-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Movies are publicly readable" ON public.movies;
CREATE POLICY "Movies are publicly readable"
  ON public.movies
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Fix episodes too
DROP POLICY IF EXISTS "Episodes are publicly readable" ON public.episodes;
CREATE POLICY "Episodes are publicly readable"
  ON public.episodes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Fix seasons too
DROP POLICY IF EXISTS "Seasons are publicly readable" ON public.seasons;
CREATE POLICY "Seasons are publicly readable"
  ON public.seasons
  FOR SELECT
  TO anon, authenticated
  USING (true);
