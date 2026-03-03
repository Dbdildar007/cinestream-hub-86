import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Movie } from "@/services/movieService";
import type { WatchProgress } from "@/hooks/useWatchProgress";

interface ContinueWatchingRowProps {
  movies: (Movie & { progress: WatchProgress })[];
  onWatch: (movie: Movie) => void;
  onRemove: (movieId: string) => void;
}

export default function ContinueWatchingRow({ movies, onWatch, onRemove }: ContinueWatchingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  if (movies.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative px-4 md:px-12 pt-6 md:pt-0 mb-8"
    >
      <h2 className="text-xl md:text-2xl font-display tracking-wide text-foreground mb-4">
        CONTINUE WATCHING
      </h2>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          {movies.map(({ progress, ...movie }) => {
            const percent = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
            const remainMin = Math.ceil((progress.duration - progress.currentTime) / 60);

            return (
              <motion.div
                key={movie.id}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ duration: 0.2 }}
                className="relative flex-shrink-0 w-[200px] md:w-[260px] cursor-pointer group/card"
                onClick={() => onWatch(movie)}
              >
                <div className="relative rounded-md overflow-hidden aspect-video bg-secondary">
                  <img
                    src={movie.heroImage || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                  {/* Play icon center */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-primary/90">
                      <Play className="w-6 h-6 text-primary-foreground fill-current" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(movie.id); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/70 hover:bg-background opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>

                  {/* Progress bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                    <div className="h-full bg-primary rounded-r-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="mt-2 flex items-start justify-between gap-2">
                  <h3 className="text-xs md:text-sm font-medium text-foreground truncate">{movie.title}</h3>
                  <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{remainMin}m left</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </motion.section>
  );
}
