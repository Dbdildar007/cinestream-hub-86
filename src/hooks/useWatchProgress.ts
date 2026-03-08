import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WatchProgress {
  movieId: string;
  episodeId?: string;
  mediaType?: 'movie' | 'series'; 
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  lastWatched: number;
}

const STORAGE_KEY = "cinestream_watch_progress";

// ── Shared module-level store ──
let sharedProgressList: WatchProgress[] = [];
const listeners = new Set<() => void>();

function loadLocalProgress(): WatchProgress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Initialize from localStorage
sharedProgressList = loadLocalProgress();

function setSharedProgress(list: WatchProgress[]) {
  sharedProgressList = list;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() {
  return sharedProgressList;
}

export function useWatchProgress() {
  const { user } = useAuth();
  const progressList = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Clear on logout, load cache + sync on login
  useEffect(() => {
    if (!user) {
      setSharedProgress([]);
      return;
    }

    // Instantly show cached data
    const cached = loadLocalProgress();
    if (cached.length) setSharedProgress(cached);

    // Then sync from DB
    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from("watch_progress")
        .select("movie_id, episode_id, media_type, current_time_sec, duration_sec, last_watched")
        .eq("user_id", user.id);

      if (error || !data) return;

      const dbList: WatchProgress[] = (data as any[]).map((d: any) => ({
        movieId: d.movie_id,
        episodeId: d.episode_id || undefined,
        mediaType: (d.media_type as 'movie' | 'series') || 'movie',
        currentTime: Number(d.current_time_sec),
        duration: Number(d.duration_sec),
        lastWatched: new Date(d.last_watched).getTime(),
      }));

      if (dbList.length > 0 || cached.length === 0) {
        setSharedProgress(dbList);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbList));
      }
    };
    fetchProgress();
  }, [user]);

  // Persist locally whenever shared list changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressList));
    }
  }, [progressList, user]);

  const updateProgress = useCallback((movieId: string, currentTime: number, duration: number, mediaType: 'movie' | 'series' = 'movie', episodeId?: string, 
    seasonNumber?: number, episodeNumber?: number) => {
    if (duration <= 0) return;

    const newItem: WatchProgress = { 
      movieId, 
      episodeId, 
      mediaType, 
      currentTime, 
      duration, 
      seasonNumber,
      episodeNumber,
      lastWatched: Date.now() 
    };

    // IMMEDIATE SHARED UPDATE (all components see it instantly)
    const prev = sharedProgressList;
    const filtered = prev.filter((p) => !(p.movieId === movieId && p.episodeId === episodeId));
    const percent = currentTime / duration;
    if (currentTime < 5 || percent > 0.95) {
      setSharedProgress(filtered);
    } else {
      setSharedProgress([newItem, ...filtered]);
    }

    // DB SYNC (debounced)
    if (user) {
      const debounceKey = `${movieId}_${episodeId || ''}`;
      if (debounceRef.current[debounceKey]) clearTimeout(debounceRef.current[debounceKey]);
      
      debounceRef.current[debounceKey] = setTimeout(async () => {
        const percent = currentTime / duration;
        const episodeVal = episodeId || '';

        await (supabase.from("watch_progress") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieId)
          .eq("episode_id", episodeVal);

        if (percent <= 0.95 && currentTime >= 5) {
          await (supabase.from("watch_progress") as any).insert({
            user_id: user.id,
            movie_id: movieId,
            episode_id: episodeVal,
            current_time_sec: Math.round(currentTime),
            duration_sec: Math.round(duration),
            media_type: mediaType,
            last_watched: new Date().toISOString(),
          });
        }
      }, 1000);
    }
  }, [user]);

  const getProgress = useCallback((movieId: string, episodeId?: string): WatchProgress | undefined => {
    const list = sharedProgressList;
    if (episodeId) {
      return list.find((p) => p.movieId === movieId && p.episodeId === episodeId);
    }
    return list.find((p) => p.movieId === movieId);
  }, []);

  const getContinueWatching = useCallback((): WatchProgress[] => {
    return [...progressList].sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 10);
  }, [progressList]);

  const refetchProgress = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("watch_progress")
      .select("movie_id, episode_id, media_type, current_time_sec, duration_sec, last_watched")
      .eq("user_id", user.id);
    if (error || !data) return;
    const dbList: WatchProgress[] = (data as any[]).map((d: any) => ({
      movieId: d.movie_id,
      episodeId: d.episode_id || undefined,
      mediaType: (d.media_type as 'movie' | 'series') || 'movie',
      currentTime: Number(d.current_time_sec),
      duration: Number(d.duration_sec),
      lastWatched: new Date(d.last_watched).getTime(),
    }));
    setSharedProgress(dbList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbList));
  }, [user]);

  const clearProgress = useCallback(async (movieId: string, episodeId?: string) => {
    const prev = sharedProgressList;
    const filtered = prev.filter((p) => {
      if (episodeId) {
        return !(p.movieId === movieId && p.episodeId === episodeId);
      }
      return p.movieId !== movieId;
    });
    setSharedProgress(filtered);

    if (user) {
      let query = supabase.from("watch_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);

      if (episodeId) {
        query = query.eq("episode_id", episodeId);
      }
      
      const { error } = await query;
      if (error) console.error("Error deleting progress:", error);
    }
  }, [user]);

  return { updateProgress, getProgress, getContinueWatching, clearProgress, refetchProgress };
}
