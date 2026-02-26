import { useState, useCallback } from "react";

const STORAGE_KEY = "cinestream_watchlist";

function loadWatchlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);

  const save = (list: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setWatchlist(list);
  };

  const toggleWatchlist = useCallback((movieId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((movieId: string) => {
    return watchlist.includes(movieId);
  }, [watchlist]);

  return { watchlist, toggleWatchlist, isInWatchlist };
}
