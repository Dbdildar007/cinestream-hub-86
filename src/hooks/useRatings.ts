import { useState, useCallback } from "react";

export function useRatings() {
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("cinestream-ratings");
    return saved ? JSON.parse(saved) : {};
  });

  const setRating = useCallback((movieId: string, rating: number) => {
    setRatings(prev => {
      const updated = { ...prev, [movieId]: rating };
      localStorage.setItem("cinestream-ratings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getRating = useCallback((movieId: string) => {
    return ratings[movieId] || 0;
  }, [ratings]);

  return { ratings, setRating, getRating };
}
