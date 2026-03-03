import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem("cinestream-ratings");
    if (saved) {
      try { setRatings(JSON.parse(saved)); } catch {}
    }

    if (!user) return;

    const fetchRatings = async () => {
      try {
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
      } catch (e) {
        console.error("Error fetching ratings:", e);
      }
    };

    fetchRatings();
  }, [user]);

  const setRating = useCallback(
    async (id: string, rating: number) => {
      // Optimistic update - always works even without login
      setRatings((prev) => {
        const updated = { ...prev, [id]: rating };
        localStorage.setItem("cinestream-ratings", JSON.stringify(updated));
        return updated;
      });

      if (!user) return;

      try {
        const { error } = await supabase
          .from('movie_ratings')
          .upsert(
            { movie_id: id, user_id: user.id, rating },
            { onConflict: 'user_id,movie_id' }
          );

        if (error) {
          console.error("Error setting rating:", error);
          setRatings((prev) => {
            const { [id]: _, ...rest } = prev;
            localStorage.setItem("cinestream-ratings", JSON.stringify(rest));
            return rest;
          });
        }
      } catch (e) {
        console.error("Rating save error:", e);
      }
    },
    [user]
  );

  const getRating = useCallback((movieId: string) => {
    return ratings[movieId] || 0;
  }, [ratings]);

  return { ratings, setRating, getRating };
}
