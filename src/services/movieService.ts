import { supabase } from '@/integrations/supabase/client';
import type { Movie } from '@/data/movies';

const CACHE_KEY = 'movies_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const movieService = {
  // Get all movies with caching
  async getAllMovies(): Promise<Movie[]> {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const { data, error } = await supabase
      .from('movies')
      .select('*');

    if (error) throw error;

    // Cache the result
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));

    return data || [];
  },

  // Get featured movies
  async getFeaturedMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_featured', true)
      .limit(3);

    if (error) throw error;
    return data || [];
  },

  // Get movies by category
  async getMoviesByCategory(category: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .contains('category', [category]);

    if (error) throw error;
    return data || [];
  },

  // Get movies by genre
  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .contains('genre', [genre]);

    if (error) throw error;
    return data || [];
  },

  // Get movies by language
  async getMoviesByLanguage(language: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language);

    if (error) throw error;
    return data || [];
  },

  // Search movies
  async searchMovies(query: string, filters?: {
    genre?: string;
    year?: number;
    minRating?: number;
  }): Promise<Movie[]> {
    let qb = supabase
      .from('movies')
      .select('*');

    if (query) {
      qb = qb.ilike('title', `%${query}%`);
    }

    if (filters?.genre) {
      qb = qb.contains('genre', [filters.genre]);
    }

    if (filters?.year) {
      qb = qb.eq('year', filters.year);
    }

    if (filters?.minRating) {
      qb = qb.gte('rating', filters.minRating);
    }

    const { data, error } = await qb;

    if (error) throw error;
    return data || [];
  },

  // Clear cache
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};