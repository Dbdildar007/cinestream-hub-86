import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("cinestream-ratings");
      if (saved) setRatings(JSON.parse(saved));
      return;
    }

    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from("movie_ratings")
        .select("movie_id, rating")
        .eq("user_id", user.id);

      if (data && !error) {
        const dbRatings = data.reduce<Record<string, number>>((acc, curr) => {
          acc[curr.movie_id] = curr.rating;
          return acc;
        }, {});
        setRatings(dbRatings);
        localStorage.setItem("cinestream-ratings", JSON.stringify(dbRatings));
      }
    };

    fetchRatings();
  }, [user]);

  const setRating = useCallback(async (movieId: string, rating: number) => {
    setRatings(prev => {
      const updated = { ...prev, [movieId]: rating };
      localStorage.setItem("cinestream-ratings", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      await supabase
        .from("movie_ratings")
        .upsert({
          movie_id: movieId,
          rating,
          user_id: user.id,
        }, { onConflict: "user_id,movie_id" });
    }
  }, [user]);

  const getRating = useCallback((movieId: string) => {
    return ratings[movieId] || 0;
  }, [ratings]);

  return { ratings, setRating, getRating };
}
