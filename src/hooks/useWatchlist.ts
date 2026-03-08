import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "cinestream_watchlist";

function loadLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>(loadLocal);

  // Clear on logout, load cache + sync on login
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    // Instantly show cached data
    const cached = loadLocal();
    if (cached.length) setWatchlist(cached);

    // Then sync from DB
    const fetch = async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const ids = data.map(d => d.movie_id);
        setWatchlist(ids);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      }
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    }
  }, [watchlist, user]);

  const toggleWatchlist = useCallback(async (movieId: string) => {
    const isIn = watchlist.includes(movieId);
    if (isIn) {
      setWatchlist(prev => prev.filter(id => id !== movieId));
      if (user) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movieId);
      }
    } else {
      setWatchlist(prev => [...prev, movieId]);
      if (user) {
        await supabase.from("watchlist").insert({ user_id: user.id, movie_id: movieId });
      }
    }
  }, [watchlist, user]);

  const isInWatchlist = useCallback((movieId: string) => {
    return watchlist.includes(movieId);
  }, [watchlist]);

  return { watchlist, toggleWatchlist, isInWatchlist };
}
