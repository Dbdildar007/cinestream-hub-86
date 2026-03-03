import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movieService';
import type { Movie } from '@/services/movieService';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type { Movie } from '@/services/movieService';

export function useMovies() {
  const { data: allMovies = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('movies-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => {
        movieService.clearCache();
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const categories = [...new Set(allMovies.flatMap(m => m.category))];
  const featuredMovies = allMovies.filter(m => m.heroImage);

  return { allMovies, featuredMovies, categories, loading, error: error?.message || null };
}

export function useFeaturedMovies() {
  const { data: movies = [], isLoading: loading } = useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: () => movieService.getFeaturedMovies(),
    staleTime: 5 * 60 * 1000,
  });

  return { movies, loading };
}

export function useMoviesByCategory(category: string | null) {
  const { data: movies = [], isLoading: loading } = useQuery({
    queryKey: ['movies', 'category', category],
    queryFn: () => movieService.getMoviesByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });

  return { movies, loading };
}
