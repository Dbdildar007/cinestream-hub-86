import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movieService';
import { allMovies as localMovies, categories as localCategories, type Movie } from '@/data/movies';

export function useMovies() {
  const { data: allMovies = localMovies, isLoading: loading, error } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
    staleTime: 5 * 60 * 1000,
    initialData: localMovies,
  });

  return { allMovies, loading, error: error?.message || null };
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

export function useCategories() {
  return localCategories;
}
