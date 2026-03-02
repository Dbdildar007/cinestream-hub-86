import { motion } from "framer-motion";
import { ChevronLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRatings } from "@/hooks/useRatings";
import { useMovies } from "@/hooks/useMovies";

export default function MyRatingsPage() {
  const navigate = useNavigate();
  const { ratings, setRating } = useRatings();
  const { allMovies } = useMovies();

  const ratedMovies = Object.entries(ratings)
    .map(([movieId, rating]) => {
      const movie = allMovies.find(m => m.id === movieId);
      if (!movie) return null;
      return { movie, userRating: rating };
    })
    .filter(Boolean) as { movie: typeof allMovies[0]; userRating: number }[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display tracking-wider text-foreground">MY RATINGS</h1>
        <span className="ml-auto text-sm text-muted-foreground">{ratedMovies.length} rated</span>
      </div>

      {ratedMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No ratings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratedMovies.map(({ movie, userRating }) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-3 rounded-lg bg-secondary"
            >
              <img src={movie.poster} alt={movie.title} className="w-16 h-24 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <p className="text-foreground text-sm font-semibold truncate">{movie.title}</p>
                  <p className="text-muted-foreground text-xs">{movie.year} • {movie.genre.slice(0, 2).join(", ")}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(movie.id, s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          s <= userRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">{userRating}/5</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
