import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth"; // Assuming you have an auth hook

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // 1. On Load: Check Cache first, then DB
  useEffect(() => {
    const fetchRatings = async () => {
      // Try local cache first
      const saved = localStorage.getItem("cinestream-ratings");
      if (saved) {
        setRatings(JSON.parse(saved));
      }

      // If user is logged in, fetch from DB to restore missing/cleared data
      if (user) {
        const { data, error } = await supabase
          .from("movie_ratings")
          .select("movie_id, rating")
          .eq("user_id", user.id);

        if (data && !error) {
          const dbRatings = data.reduce((acc, curr) => ({
            ...acc,
            [curr.movie_id]: curr.rating
          }), {});
          
          // Sync DB to Local State and LocalStorage
          setRatings(dbRatings);
          localStorage.setItem("cinestream-ratings", JSON.stringify(dbRatings));
        }
      }
    };

    fetchRatings();
  }, [user]);

  // 2. Save Rating: Update both Local and DB
  const setRating = useCallback(async (movieId: string, rating: number) => {
    // Update UI immediately (Local State)
    setRatings(prev => {
      const updated = { ...prev, [movieId]: rating };
      localStorage.setItem("cinestream-ratings", JSON.stringify(updated));
      return updated;
    });

    // Save to Supabase for persistence
    if (user) {
      await supabase
        .from("movie_ratings")
        .upsert({ 
          movie_id: movieId, 
          rating: rating, 
          user_id: user.id 
        }, { onConflict: 'user_id,movie_id' });
    }
  }, [user]);

  const getRating = useCallback((movieId: string) => {
    return ratings[movieId] || 0;
  }, [ratings]);

  return { ratings, setRating, getRating };
}
