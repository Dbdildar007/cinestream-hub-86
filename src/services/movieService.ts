import { supabase } from '@/integrations/supabase/client';
import type { Movie } from '@/data/movies';
import { allMovies as localMovies } from '@/data/movies';
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
  const isUrl = (path: string) => path?.startsWith('http') || path?.startsWith('https');

  // Support both local data format and DB format
  const poster = row.poster_url || row.poster || '';
  const heroImage = row.banner_url || row.hero_image || row.heroImage || '';
  const genreField = row.genre || '';
  const genres = Array.isArray(genreField) ? genreField : (typeof genreField === 'string' && genreField ? genreField.split(',').map((g: string) => g.trim()) : []);

  return {
    id: row.id,
    title: row.title || 'Untitled',
    year: row.release_year || row.year || new Date().getFullYear(),
    rating: Number(row.rating) || 0,
    genre: genres,
    category: Array.isArray(row.category) ? row.category : genres,
    language: row.language || 'English',
    description: row.description || '',
    poster: isUrl(poster) ? poster : (posterMap[poster] || poster || ''),
    heroImage: isUrl(heroImage) ? heroImage : (heroMap[heroImage] || heroImage || undefined),
    url: row.video_url || row.url || undefined,
    newly_added: row.newly_added || undefined,
    duration: row.duration || '',
    isTrending: !!row.is_trending || !!row.isTrending,
    isEditorChoice: !!row.is_editor_choice || !!row.isEditorChoice,
    isSeries: !!row.is_series || !!row.isSeries,
  };
}

const CACHE_KEY = 'movies_cache';
const CACHE_DURATION = 5 * 60 * 1000;

export const movieService = {
  async getAllMovies(): Promise<Movie[]> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data.map(mapDbMovie);
        }
      }
    } catch (e) {
      console.log("cache read error:", e);
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("No data in DB, falling back to local data");
        return localMovies;
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));

      return data.map(mapDbMovie);
    } catch (error) {
      console.error("DB fetch failed, using local fallback:", error);
      return localMovies;
    }
  },

  async getFeaturedMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_featured', true)
      .limit(10);

    if (error || !data || data.length === 0) {
      return localMovies.filter(m => m.heroImage);
    }
    return data.map(mapDbMovie);
  },

  async getMoviesByCategory(category: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('genre', `%${category}%`);

    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('genre', `%${genre}%`);

    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  async searchMovies(query: string, filters?: {
    genre?: string;
    year?: number;
    minRating?: number;
  }): Promise<Movie[]> {
    let qb = supabase.from('movies').select('*') as any;

    if (query) qb = qb.ilike('title', `%${query}%`);
    if (filters?.genre) qb = qb.ilike('genre', `%${filters.genre}%`);
    if (filters?.year) qb = qb.eq('release_year', filters.year);
    if (filters?.minRating) qb = qb.gte('rating', filters.minRating);

    const { data, error } = await qb.range(0, 50);
    if (error) throw error;
    return (data || []).map(mapDbMovie);
  },

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};
