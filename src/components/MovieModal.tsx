import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Download, Star, Clock, Calendar, Globe, Check } from "lucide-react";
import type { Movie } from "@/data/movies";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onDownload: (movieId: string) => void;
  downloadState?: { progress: number; status: string };
  userRating: number;
  onRate: (movieId: string, rating: number) => void;
  onWatch?: (movie: Movie) => void;
}

export default function MovieModal({ movie, onClose, onDownload, downloadState, userRating, onRate, onWatch }: MovieModalProps) {
  const isMobile = useIsMobile();

  if (!movie) return null;

  // Mobile: slide up from bottom. Desktop: side drawer from right.
  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  const desktopVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  const variants = isMobile ? mobileVariants : desktopVariants;

  return (
    <AnimatePresence>
      {movie && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed z-50 bg-card overflow-y-auto ${
              isMobile
                ? "inset-x-0 bottom-0 top-[10%] rounded-t-2xl"
                : "top-0 right-0 bottom-0 w-[480px] border-l border-border"
            }`}
          >
            {/* Header image */}
            <div className="relative h-64 md:h-72">
              <img src={movie.heroImage || movie.poster} alt={movie.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/60 hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="px-6 pb-8 -mt-16 relative">
              <h2 className="text-3xl font-display tracking-wider text-foreground mb-2">
                {movie.title.toUpperCase()}
              </h2>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  {movie.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {movie.language}
                </span>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {movie.genre.map((g) => (
                  <span key={g} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-foreground/80 text-sm leading-relaxed mb-6">{movie.description}</p>

              {/* Star rating */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">Your Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onRate(movie.id, star)}>
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= userRating ? "text-cine-gold fill-cine-gold" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => onWatch?.(movie)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-semibold text-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </button>
                <button
                  onClick={() => onDownload(movie.id)}
                  className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-md font-semibold text-sm transition-colors"
                >
                  {downloadState?.status === "complete" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadState?.status === "complete" ? "Downloaded" : "Download"}
                </button>
              </div>

              {/* Download progress */}
              {downloadState?.status === "downloading" && (
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${downloadState.progress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
