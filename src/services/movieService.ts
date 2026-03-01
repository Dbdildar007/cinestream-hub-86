import { allMovies, featuredMovies, type Movie } from '@/data/movies';

const CACHE_KEY = 'movies_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const movieService = {
  // Get all movies (from local data, cached)
  async getAllMovies(): Promise<Movie[]> {
    return allMovies;
  },

  // Get featured movies
  async getFeaturedMovies(): Promise<Movie[]> {
    return featuredMovies;
  },

  // Get movies by category
  async getMoviesByCategory(category: string): Promise<Movie[]> {
    return allMovies.filter(m => m.category.includes(category));
  },

  // Get movies by genre
  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    return allMovies.filter(m => m.genre.includes(genre));
  },

  // Get movies by language
  async getMoviesByLanguage(language: string): Promise<Movie[]> {
    return allMovies.filter(m => m.language === language);
  },

  // Search movies
  async searchMovies(query: string, filters?: {
    genre?: string;
    year?: number;
    minRating?: number;
  }): Promise<Movie[]> {
    return allMovies.filter(m => {
      if (query && !m.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters?.genre && !m.genre.includes(filters.genre)) return false;
      if (filters?.year && m.year !== filters.year) return false;
      if (filters?.minRating && m.rating < filters.minRating) return false;
      return true;
    });
  },

  // Clear cache
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};
