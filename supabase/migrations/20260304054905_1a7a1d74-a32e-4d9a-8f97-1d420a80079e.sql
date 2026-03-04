
-- 1. Add is_series column to movies
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS is_series boolean NOT NULL DEFAULT false;

-- 2. Insert series data into movies table
INSERT INTO public.movies (id, title, description, genre, category, poster, hero_image, rating, year, is_featured, is_series, language)
SELECT 
  s.id, 
  s.title, 
  s.description, 
  s.genre,
  s.genre, -- use genre as category for series
  s.poster_url, 
  s.banner_url, 
  s.rating, 
  s.release_year, 
  s.is_featured, 
  true,
  s.language
FROM public.series s
WHERE NOT EXISTS (SELECT 1 FROM public.movies m WHERE m.id = s.id);

-- 3. Drop the old FK on seasons referencing series
ALTER TABLE public.seasons DROP CONSTRAINT IF EXISTS seasons_series_id_fkey;

-- 4. Add new FK on seasons.series_id -> movies.id
ALTER TABLE public.seasons ADD CONSTRAINT seasons_movie_id_fkey 
  FOREIGN KEY (series_id) REFERENCES public.movies(id) ON DELETE CASCADE;

-- 5. Drop the series table RLS policies
DROP POLICY IF EXISTS "Series are publicly readable" ON public.series;

-- 6. Drop the series table
DROP TABLE IF EXISTS public.series;
