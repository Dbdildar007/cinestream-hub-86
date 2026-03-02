import { motion } from "framer-motion";
import { ChevronLeft, Clock, Play, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useMovies } from "@/hooks/useMovies";

export default function WatchHistoryPage() {
  const navigate = useNavigate();
  const { getContinueWatching, clearProgress } = useWatchProgress();
  const { allMovies } = useMovies();

  const progressList = getContinueWatching();
  const items = progressList
    .map(p => {
      const movie = allMovies.find(m => m.id === p.movieId);
      if (!movie) return null;
      return { movie, progress: p };
    })
    .filter(Boolean) as { movie: typeof allMovies[0]; progress: typeof progressList[0] }[];

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
        <h1 className="text-xl font-display tracking-wider text-foreground">WATCH HISTORY</h1>
        <span className="ml-auto text-sm text-muted-foreground">{items.length} titles</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No watch history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ movie, progress }) => {
            const percent = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
            const timeAgo = Date.now() - progress.lastWatched;
            const label = timeAgo < 3600000 ? `${Math.floor(timeAgo / 60000)}m ago` :
                          timeAgo < 86400000 ? `${Math.floor(timeAgo / 3600000)}h ago` :
                          `${Math.floor(timeAgo / 86400000)}d ago`;
            return (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 p-3 rounded-lg bg-secondary"
              >
                <div className="relative w-20 h-28 rounded overflow-hidden flex-shrink-0">
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <p className="text-foreground text-sm font-semibold truncate">{movie.title}</p>
                    <p className="text-muted-foreground text-xs">{movie.year} • {movie.genre.slice(0, 2).join(", ")}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {Math.floor(percent)}% watched • {label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-1 text-primary text-xs font-medium"
                    >
                      <Play className="w-3 h-3 fill-current" /> Resume
                    </button>
                    <button
                      onClick={() => clearProgress(movie.id)}
                      className="flex items-center gap-1 text-destructive text-xs"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
