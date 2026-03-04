import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WatchProgress {
  movieId: string;
  currentTime: number;
  duration: number;
  lastWatched: number;
  mediaType?: 'movie' | 'series'; 
  episodeId?: string;
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
        .select("movie_id, current_time_sec, duration_sec, last_watched")
        .eq("user_id", user.id);
      if (data) {
        const dbList: WatchProgress[] = data.map(d => ({
          movieId: d.movie_id,
          currentTime: d.current_time_sec,
          duration: d.duration_sec,
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

  const updateProgress = useCallback((movieId: string, currentTime: number, duration: number,mediaType: 'movie' | 'series' = 'movie',
  episodeId?: string) => {
    if (duration <= 0) return;
    setProgressList((prev) => {
      const filtered = prev.filter((p) => p.movieId !== movieId);
      const percent = currentTime / duration;
      if (currentTime < 5) return filtered;
      if (percent > 0.95) return filtered;
      return [{ movieId, currentTime, duration, lastWatched: Date.now() }, ...filtered];
    });

    // Debounced DB sync
    if (user) {
      if (debounceRef.current[movieId]) clearTimeout(debounceRef.current[movieId]);
      debounceRef.current[movieId] = setTimeout(async () => {
        const percent = currentTime / duration;
        if (percent > 0.95 || currentTime < 5) {
  const query = supabase.from("watch_progress").delete().eq("user_id", user.id).eq("movie_id", movieId);
  if (episodeId) query.eq("episode_id", episodeId); // Only delete specific episode
  await query;
} else {
       await supabase.from("watch_progress").upsert({
  user_id: user.id,
  movie_id: movieId,
  episode_id: episodeId, // Add this field (ensure it exists in your DB)
  current_time_sec: currentTime,
  duration_sec: duration,
  media_type: mediaType,  // Add this field (ensure it exists in your DB)
  last_watched: new Date().toISOString(),
}, { 
  onConflict: "user_id,movie_id,episode_id" // Update conflict constraint
});
        }
      }, 3000);
    }
  }, [user]);

  const getProgress = useCallback((movieId: string): WatchProgress | undefined => {
    return progressList.find((p) => p.movieId === movieId);
  }, [progressList]);

  const getContinueWatching = useCallback((): WatchProgress[] => {
    return [...progressList].sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 10);
  }, [progressList]);

  const clearProgress = useCallback(async (movieId: string) => {
    setProgressList((prev) => prev.filter((p) => p.movieId !== movieId));
    if (user) {
      await supabase.from("watch_progress").delete().eq("user_id", user.id).eq("movie_id", movieId);
    }
  }, [user]);

  return { updateProgress, getProgress, getContinueWatching, clearProgress };
}
