import { motion } from "framer-motion";
import { Download, Trash2, Play, Star } from "lucide-react";
import { allMovies } from "@/data/movies";
import { useDownloads } from "@/hooks/useDownloads";

export default function DownloadsPage() {
  const { downloads, removeDownload } = useDownloads();

  const downloadedMovies = downloads
    .filter((d) => d.status === "complete")
    .map((d) => ({ ...d, movie: allMovies.find((m) => m.id === d.movieId) }))
    .filter((d) => d.movie);

  const activeDownloads = downloads.filter((d) => d.status === "downloading");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24"
    >
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-foreground mb-2">MY DOWNLOADS</h1>
      <p className="text-sm text-muted-foreground mb-8">{downloadedMovies.length} movies downloaded</p>

      {/* Active downloads */}
      {activeDownloads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-display tracking-wide text-foreground mb-4">DOWNLOADING</h2>
          {activeDownloads.map((d) => {
            const movie = allMovies.find((m) => m.id === d.movieId);
            if (!movie) return null;
            return (
              <div key={d.movieId} className="flex items-center gap-4 p-3 rounded-lg bg-secondary mb-2">
                <img src={movie.poster} alt={movie.title} className="w-12 h-16 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
                  <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${d.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(d.progress)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Downloaded */}
      {downloadedMovies.length > 0 ? (
        <div className="space-y-3">
          {downloadedMovies.map(({ movieId, movie }) => (
            <motion.div
              key={movieId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary group"
            >
              <img src={movie!.poster} alt={movie!.title} className="w-14 h-20 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{movie!.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-cine-gold fill-cine-gold" />
                  <span>{movie!.rating}</span>
                  <span>•</span>
                  <span>{movie!.duration}</span>
                  <span>•</span>
                  <span>{movie!.language}</span>
                </div>
              </div>
              <button className="p-2.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors">
                <Play className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => removeDownload(movieId)}
                className="p-2.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : activeDownloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Download className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">No downloads yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Download movies to watch offline</p>
        </div>
      ) : null}
    </motion.div>
  );
}
