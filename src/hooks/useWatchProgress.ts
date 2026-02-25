import { useState, useCallback, useEffect } from "react";

export interface WatchProgress {
  movieId: string;
  currentTime: number;
  duration: number;
  lastWatched: number; // timestamp
}

const STORAGE_KEY = "cinestream_watch_progress";

function loadProgress(): WatchProgress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useWatchProgress() {
  const [progressList, setProgressList] = useState<WatchProgress[]>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressList));
  }, [progressList]);

  const updateProgress = useCallback((movieId: string, currentTime: number, duration: number) => {
    if (duration <= 0) return;
    setProgressList((prev) => {
      const filtered = prev.filter((p) => p.movieId !== movieId);
      // Only save if watched more than 5 seconds and less than 95% complete
      const percent = currentTime / duration;
      if (currentTime < 5) return filtered;
      if (percent > 0.95) {
        // Completed — remove from continue watching
        return filtered;
      }
      return [{ movieId, currentTime, duration, lastWatched: Date.now() }, ...filtered];
    });
  }, []);

  const getProgress = useCallback((movieId: string): WatchProgress | undefined => {
    return progressList.find((p) => p.movieId === movieId);
  }, [progressList]);

  const getContinueWatching = useCallback((): WatchProgress[] => {
    return [...progressList].sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 10);
  }, [progressList]);

  const clearProgress = useCallback((movieId: string) => {
    setProgressList((prev) => prev.filter((p) => p.movieId !== movieId));
  }, []);

  return { updateProgress, getProgress, getContinueWatching, clearProgress };
}
