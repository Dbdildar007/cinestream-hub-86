import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Download, Star, Clock, Calendar, Globe, Check, Plus, CheckCircle, Tv } from "lucide-react";
import type { Movie } from "@/services/movieService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onDownload: (movieId: string) => void;
  downloadState?: { progress: number; status: string };
  userRating: number;
  onRate: (movieId: string, rating: number) => void;
  onWatch?: (movie: Movie) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (movieId: string) => void;
}

export default function MovieModal({
  movie, onClose, onDownload, downloadState, userRating, onRate, onWatch,
  isInWatchlist, onToggleWatchlist,
}: MovieModalProps) {
  const isMobile = useIsMobile();
  const [selectedSeason, setSelectedSeason] = useState(1);

  if (!movie) return null;

  const seriesInfo = undefined as any;
  const currentSeasonData = undefined as any;

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
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 2. Modal Content */}
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
            {/* Header image section - FIXED: Added opening <div> */}
            <div className="relative aspect-[4/3] md:aspect-video">
              <img 
                src={movie.heroImage || movie.poster} 
                alt={movie.title} 
                className="w-full h-full object-cover object-center" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/60 hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              {movie.isSeries && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 px-2.5 py-1 rounded-full">
                  <Tv className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground">Series</span>
                </div>
              )}
            </div>

            {/* Content section - Now safely inside motion.div */}
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

             {/* Star rating - Row layout fix */}
<div className="mb-6 flex items-center gap-4">
  <p className="text-xs text-muted-foreground whitespace-nowrap">Like it</p>
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button 
        key={star} 
        onClick={() => onRate?.(movie.id, star)}
        className="p-1 -m-1 transition-transform hover:scale-110"
      >
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
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => onWatch?.(movie)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-semibold text-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {movie.isSeries ? "Play S1 E1" : "Watch Now"}
                </button>

                <button
                  onClick={() => onToggleWatchlist?.(movie.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${
                    isInWatchlist
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                >
                  {isInWatchlist ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isInWatchlist ? "Listed" : "My List"}
                </button>
              </div>

              {/* Series logic */}
              {seriesInfo && (
                <div className="mt-6">
                  <h3 className="text-lg font-display tracking-wide text-foreground mb-3">EPISODES</h3>
                  <div className="space-y-2">
                    {currentSeasonData?.episodes.map((episode: any) => (
                      <button
                        key={episode.id}
                        onClick={() => onWatch?.(movie)}
                        className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-primary">E{episode.number}</span>
                          <h4 className="text-sm font-medium text-foreground">{episode.title}</h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
