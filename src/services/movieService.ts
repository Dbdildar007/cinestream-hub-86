import { supabase } from '@/integrations/supabase/client';
import type { Movie } from '@/data/movies';
import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";
import poster7 from "@/assets/poster-7.jpg";
import poster8 from "@/assets/poster-8.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

// Map DB poster paths to imported assets
const posterMap: Record<string, string> = {
  '/assets/poster-1.jpg': poster1,
  '/assets/poster-2.jpg': poster2,
  '/assets/poster-3.jpg': poster3,
  '/assets/poster-4.jpg': poster4,
  '/assets/poster-5.jpg': poster5,
  '/assets/poster-6.jpg': poster6,
  '/assets/poster-7.jpg': poster7,
  '/assets/poster-8.jpg': poster8,
};

const heroMap: Record<string, string> = {
  '/assets/hero-1.jpg': hero1,
  '/assets/hero-2.jpg': hero2,
  '/assets/hero-3.jpg': hero3,
};

function mapDbMovie(row: any): Movie {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    rating: Number(row.rating),
    genre: row.genre || [],
    category: row.category || [],
    language: row.language,
    description: row.description,
    poster: posterMap[row.poster] || row.poster,
    heroImage: row.hero_image ? (heroMap[row.hero_image] || row.hero_image) : undefined,
    url: row.url,
    newly_added: row.newly_added,
    duration: row.duration,
    isTrending: row.is_trending,
    isEditorChoice: row.is_editor_choice,
    isSeries: row.is_series,
  };
}

const CACHE_KEY = 'movies_cache';
const CACHE_DURATION = 5 * 60 * 1000;

export const movieService = {
  async getAllMovies(): Promise<Movie[]> {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data.map(mapDbMovie);
      }
    }

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: data || [],
      timestamp: Date.now()
    }));

    return (data || []).map(mapDbMovie);
  },

  async getFeaturedMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_featured', true)
      .limit(3);

    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  async getMoviesByCategory(category: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .contains('category', [category]);

    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .contains('genre', [genre]);

    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  async searchMovies(query: string, filters?: {
    genre?: string;
    year?: number;
    minRating?: number;
  }): Promise<Movie[]> {
    let qb = supabase.from('movies').select('*');

    if (query) qb = qb.ilike('title', `%${query}%`);
    if (filters?.genre) qb = qb.contains('genre', [filters.genre]);
    if (filters?.year) qb = qb.eq('year', filters.year);
    if (filters?.minRating) qb = qb.gte('rating', filters.minRating);

    const { data, error } = await qb.range(0, 50);
    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};
