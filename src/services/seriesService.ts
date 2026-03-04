import { supabase } from '@/integrations/supabase/client';
import { posterMap, heroMap, resolveImageUrl } from './movieService';
import poster1 from "@/assets/poster-1.jpg";

export interface SeriesEpisode {
  id: string;
  number: number;
  title: string;
  duration: string;
  description: string;
  video_url?: string;
  thumbnail_url?: string;
  season_id: string;
  series_id: string;
}

export interface SeriesSeason {
  id: string;
  number: number;
  title?: string;
  episodes: SeriesEpisode[];
}

export interface Series {
  id: string;
  title: string;
  description: string;
  genre: string[];
  poster_url: string;
  banner_url?: string;
  rating: number;
  release_year: number;
  is_featured: boolean;
  seasons?: SeriesSeason[];
}

export interface SeriesWithSeasons extends Series {
  seasons: SeriesSeason[];
}

const SERIES_CACHE_KEY = 'series_cache';
const CACHE_DURATION = 5 * 60 * 1000;

function mapSeries(row: any): Series {
  const genreField = row.genre || '';
  const genres = Array.isArray(genreField)
    ? genreField
    : (typeof genreField === 'string' && genreField ? genreField.split(',').map((g: string) => g.trim()) : []);
  return {
    id: row.id,
    title: row.title || 'Untitled',
    description: row.description || '',
    genre: genres,
    poster_url: resolveImageUrl(row.poster || row.poster_url, posterMap) || poster1,
    banner_url: resolveImageUrl(row.hero_image || row.banner_url, heroMap),
    rating: Number(row.rating) || 0,
    release_year: row.year || row.release_year || new Date().getFullYear(),
    is_featured: !!row.is_featured,
  };
}

function mapEpisode(row: any, seriesId: string): SeriesEpisode {
  return {
    id: row.id,
    number: row.episode_number,
    title: row.title || `Episode ${row.episode_number}`,
    duration: row.duration || '',
    description: row.description || '',
    thumbnail_url: row.thumbnail_url || undefined,
    video_url: row.video_url || undefined,
    season_id: row.season_id,
    series_id: seriesId,
  };
}

export const seriesService = {
  async getAllSeries(): Promise<Series[]> {
    try {
      const cached = localStorage.getItem(SERIES_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }

    // Query movies table where is_series = true
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_series', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const mapped = data.map(mapSeries);

    try {
      localStorage.setItem(SERIES_CACHE_KEY, JSON.stringify({
        data: mapped,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error("Cache write error:", e);
    }

    return mapped;
  },

  async getSeriesWithSeasons(seriesId: string): Promise<SeriesWithSeasons | null> {
    // Fetch from movies table
    const { data: seriesData, error: seriesError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', seriesId)
      .eq('is_series', true)
      .maybeSingle();

    if (seriesError || !seriesData) return null;

    const { data: seasonsData, error: seasonsError } = await supabase
      .from('seasons')
      .select(`
        id,
        season_number,
        episodes (*)
      `)
      .eq('series_id', seriesId)
      .order('season_number', { ascending: true });

    if (seasonsError) {
      console.error("Error fetching seasons:", seasonsError);
    }

    const seasons: SeriesSeason[] = (seasonsData || []).map((s: any) => ({
      id: s.id,
      number: s.season_number,
      episodes: (s.episodes || [])
        .sort((a: any, b: any) => a.episode_number - b.episode_number)
        .map((e: any) => mapEpisode(e, seriesId)),
    }));

    return {
      ...mapSeries(seriesData),
      seasons,
    };
  },

  async getFeaturedSeries(): Promise<Series[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_series', true)
      .eq('is_featured', true)
      .limit(10);

    if (error || !data) return [];
    return data.map(mapSeries);
  },

  clearCache(): void {
    localStorage.removeItem(SERIES_CACHE_KEY);
  },
};
