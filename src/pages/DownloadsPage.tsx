import { motion } from "framer-motion";
import { Download, Trash2, Play, Star } from "lucide-react";
import { useMovies } from "@/hooks/useMovies";
import { useDownloads } from "@/hooks/useDownloads";

export default function DownloadsPage() {
  const { downloads, removeDownload } = useDownloads();
  const { allMovies } = useMovies();

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
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-foreground mb-6">DOWNLOADS</h1>

      {activeDownloads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Downloading</h2>
          {activeDownloads.map((d) => {
            const movie = allMovies.find((m) => m.id === d.movieId);
            if (!movie) return null;
            return (
              <div key={d.movieId} className="flex gap-3 p-3 rounded-lg bg-secondary mb-2">
                <img src={movie.poster} alt={movie.title} className="w-16 h-24 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-foreground text-sm font-semibold">{movie.title}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${d.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.progress}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {downloadedMovies.length === 0 && activeDownloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Download className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No downloads yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloadedMovies.map((d) => (
            <motion.div
              key={d.movieId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-3 rounded-lg bg-secondary"
            >
              <img src={d.movie!.poster} alt={d.movie!.title} className="w-16 h-24 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <p className="text-foreground text-sm font-semibold truncate">{d.movie!.title}</p>
                  <p className="text-muted-foreground text-xs">{d.movie!.year} • {d.movie!.genre.slice(0, 2).join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-primary text-xs font-medium">
                    <Play className="w-3 h-3 fill-current" /> Play
                  </button>
                  <button
                    onClick={() => removeDownload(d.movieId)}
                    className="flex items-center gap-1 text-destructive text-xs"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
