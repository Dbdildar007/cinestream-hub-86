import { useState, useEffect } from 'react';
import { movieService } from '@/services/movieService';
import type { Movie } from '@/data/movies';

export function useMovies() {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await movieService.getAllMovies();
        setAllMovies(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  return { allMovies, loading, error };
}

// Separate hooks for specific queries
export function useFeaturedMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getFeaturedMovies().then(data => {
      setMovies(data);
      setLoading(false);
    });
  }, []);

  return { movies, loading };
}

export function useMoviesByCategory(category: string | null) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    movieService.getMoviesByCategory(category).then(data => {
      setMovies(data);
      setLoading(false);
    });
  }, [category]);

  return { movies, loading };
}