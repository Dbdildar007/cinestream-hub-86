import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      setRatings({});
      return;
    }

    // Instantly show cached data
    const saved = localStorage.getItem("cinestream-ratings");
    if (saved) {
      try { setRatings(JSON.parse(saved)); } catch {}
    }

    // Then sync from DB in background
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
      const currentRating = ratings[id] || 0;
      // Toggle to zero if clicking same star
      const newRating = currentRating === rating ? 0 : rating;

      if (newRating === 0) {
        // Remove from state and cache
        setRatings((prev) => {
          const { [id]: _, ...rest } = prev;
          localStorage.setItem("cinestream-ratings", JSON.stringify(rest));
          return rest;
        });

        if (!user) return;

        // Delete from DB
        try {
          const { error } = await supabase
            .from('movie_ratings')
            .delete()
            .eq('user_id', user.id)
            .eq('movie_id', id);

          if (error) console.error("Error deleting rating:", error);
        } catch (e) {
          console.error("Rating delete error:", e);
        }
      } else {
        // Set/update rating
        setRatings((prev) => {
          const updated = { ...prev, [id]: newRating };
          localStorage.setItem("cinestream-ratings", JSON.stringify(updated));
          return updated;
        });

        if (!user) return;

        try {
          const { error } = await supabase
            .from('movie_ratings')
            .upsert(
              { movie_id: id, user_id: user.id, rating: newRating },
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
      }
    },
    [user, ratings]
  );

  const getRating = useCallback((movieId: string) => {
    return ratings[movieId] || 0;
  }, [ratings]);

  return { ratings, setRating, getRating };
}
