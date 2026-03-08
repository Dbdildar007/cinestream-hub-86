import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WatchProgress {
  movieId: string;
  episodeId?: string;      // Ensure this is here
  mediaType?: 'movie' | 'series'; 
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  lastWatched: number;
}

const STORAGE_KEY = "cinestream_watch_progress";

function loadLocalProgress(): WatchProgress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useWatchProgress() {
  const { user } = useAuth();
  const [progressList, setProgressList] = useState<WatchProgress[]>(loadLocalProgress);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

 // Load from DB on login
  useEffect(() => {
    if (!user) return;
  const fetchProgress = async () => {
      const { data } = await supabase
        .from("watch_progress")
        .select("movie_id, episode_id, media_type, current_time_sec, duration_sec, last_watched, season_number, episode_number")
        .eq("user_id", user.id);

      if (data) {
        const dbList: WatchProgress[] = (data as any[]).map((d: any) => ({
          movieId: d.movie_id,
          episodeId: d.episode_id || undefined,
          mediaType: (d.media_type as 'movie' | 'series') || 'movie',
          currentTime: Number(d.current_time_sec),
          duration: Number(d.duration_sec),
          seasonNumber: d.season_number,
          episodeNumber: d.episode_number,
          lastWatched: new Date(d.last_watched).getTime(),
        }));
        setProgressList(dbList);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbList));
      }
    };
    fetchProgress();
  }, [user]);

  // Persist locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressList));
  }, [progressList]);

 const updateProgress = useCallback((movieId: string, currentTime: number, duration: number, mediaType: 'movie' | 'series' = 'movie', episodeId?: string, 
  seasonNumber?: number, episodeNumber?: number) => {
    if (duration <= 0) return;

    // 1. IMMEDIATE LOCAL UPDATE (Optimistic UI)
 const newItem: WatchProgress = { 
  movieId, 
  episodeId, 
  mediaType, 
  currentTime, 
  duration, 
  seasonNumber, // Add this
  episodeNumber, // Add this
  lastWatched: Date.now() 
};

    setProgressList((prev) => {
      // Filter out the old version of this specific item/episode
      const filtered = prev.filter((p) => !(p.movieId === movieId && p.episodeId === episodeId));
      
      const percent = currentTime / duration;
      // If watched less than 5s or more than 95%, we don't show it in "Continue Watching"
      if (currentTime < 5 || percent > 0.95) return filtered;
      
      // Add the new progress to the top of the list immediately
      return [newItem, ...filtered];
    });

    // 2. FASTER DB SYNC (Reduced from 3s to 1s)
    if (user) {
      const debounceKey = `${movieId}_${episodeId || ''}`;
      if (debounceRef.current[debounceKey]) clearTimeout(debounceRef.current[debounceKey]);
      
      debounceRef.current[debounceKey] = setTimeout(async () => {
        const percent = currentTime / duration;
        const episodeVal = episodeId || '';

        // Clean up old entry
        await (supabase.from("watch_progress") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieId)
          .eq("episode_id", episodeVal);

        // Insert fresh progress if within 5% - 95% range
        if (percent <= 0.95 && currentTime >= 5) {
          await (supabase.from("watch_progress") as any).insert({
            user_id: user.id,
            movie_id: movieId,
            episode_id: episodeVal,
            season_number: seasonNumber,  
            episode_number: episodeNumber, 
            current_time_sec: Math.round(currentTime),
            duration_sec: Math.round(duration),
            media_type: mediaType,
            last_watched: new Date().toISOString(),
          });
        }
      }, 1000); // Syncs to database after 1 second of pause
    }
  }, [user]);
  

  const getProgress = useCallback((movieId: string, episodeId?: string): WatchProgress | undefined => {
    if (episodeId) {
      return progressList.find((p) => p.movieId === movieId && p.episodeId === episodeId);
    }
    return progressList.find((p) => p.movieId === movieId);
  }, [progressList]);

  const getContinueWatching = useCallback((): WatchProgress[] => {
    return [...progressList].sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 10);
  }, [progressList]);

const clearProgress = useCallback(async (movieId: string, episodeId?: string) => {
  // Update local state first
  setProgressList((prev) =>
    prev.filter((p) => {
      // If we have an episodeId, only remove that specific episode
      if (episodeId) {
        return !(p.movieId === movieId && p.episodeId === episodeId);
      } 
      // If no episodeId (Series level delete), remove EVERYTHING for this series ID
      return p.movieId !== movieId;
    })
  );

  if (user) {
    // Delete from Supabase
    let query = supabase.from("watch_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movieId);

    // Only add the episode filter if we are deleting a single episode
    if (episodeId) {
      query = query.eq("episode_id", episodeId);
    }
    
    const { error } = await query;
    if (error) console.error("Error deleting progress:", error);
  }
}, [user, supabase]);

  return { updateProgress, getProgress, getContinueWatching, clearProgress };
}
