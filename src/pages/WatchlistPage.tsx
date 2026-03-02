import { motion } from "framer-motion";
import { ChevronLeft, Trash2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/data/movies";

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const { allMovies } = useMovies();

  const movies = watchlist
    .map(id => allMovies.find(m => m.id === id))
    .filter(Boolean) as Movie[];

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
        <h1 className="text-xl font-display tracking-wider text-foreground">MY WATCHLIST</h1>
        <span className="ml-auto text-sm text-muted-foreground">{movies.length} titles</span>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-2">Your watchlist is empty</p>
          <button onClick={() => navigate("/")} className="text-primary text-sm font-medium">Browse movies</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {movies.map((movie) => (
            <motion.div
              key={movie.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group rounded-lg overflow-hidden bg-secondary"
            >
              <img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-foreground text-sm font-semibold truncate">{movie.title}</p>
                <p className="text-muted-foreground text-xs">{movie.year} • {movie.rating}/10</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground py-1.5 rounded text-xs font-medium"
                  >
                    <Play className="w-3 h-3 fill-current" /> Play
                  </button>
                  <button
                    onClick={() => toggleWatchlist(movie.id)}
                    className="p-1.5 rounded bg-destructive/80 text-destructive-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Mobile: always show title */}
              <div className="md:hidden p-2">
                <p className="text-foreground text-xs font-medium truncate">{movie.title}</p>
                <p className="text-muted-foreground text-[10px]">{movie.year}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
