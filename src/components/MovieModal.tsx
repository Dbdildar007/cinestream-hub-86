import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Download, Star, Clock, Calendar, Globe, Check, Plus, CheckCircle, Tv } from "lucide-react";
import type { Movie } from "@/data/movies";
import { getSeriesData } from "@/data/series";
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

  const seriesInfo = movie.isSeries ? getSeriesData(movie.id) : undefined;
  const currentSeasonData = seriesInfo?.seasons.find(s => s.number === selectedSeason);

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
              {movie.isSeries && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 px-2.5 py-1 rounded-full">
                  <Tv className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground">Series</span>
                </div>
              )}
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
                {movie.isSeries && seriesInfo && (
                  <span className="text-primary font-medium">
                    {seriesInfo.seasons.length} Season{seriesInfo.seasons.length > 1 ? "s" : ""}
                  </span>
                )}
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
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onWatch?.(movie)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-semibold text-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {movie.isSeries ? "Play S1 E1" : "Watch Now"}
                </button>
                <button
                  onClick={() => onToggleWatchlist?.(movie.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md font-semibold text-sm transition-colors ${
                    isInWatchlist
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                >
                  {isInWatchlist ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isInWatchlist ? "Listed" : "My List"}
                </button>
                <button
                  onClick={() => onDownload(movie.id)}
                  className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-3 rounded-md font-semibold text-sm transition-colors"
                >
                  {downloadState?.status === "complete" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Download progress */}
              {downloadState?.status === "downloading" && (
                <div className="mb-6 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${downloadState.progress}%` }}
                  />
                </div>
              )}

              {/* Hotstar-style Season/Episode selector for series */}
              {seriesInfo && (
                <div className="mt-2">
                  <h3 className="text-lg font-display tracking-wide text-foreground mb-3">EPISODES</h3>
                  
                  {/* Season tabs */}
                  {seriesInfo.seasons.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                      {seriesInfo.seasons.map((season) => (
                        <button
                          key={season.number}
                          onClick={() => setSelectedSeason(season.number)}
                          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            selectedSeason === season.number
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "bg-secondary text-secondary-foreground hover:bg-cine-surface-hover"
                          }`}
                        >
                          Season {season.number}
                          <span className="ml-1.5 text-xs opacity-70">
                            ({season.episodes.length} ep)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Episode list - Hotstar style */}
                  <div className="space-y-2">
                    {currentSeasonData?.episodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => onWatch?.(movie)}
                        className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Thumbnail placeholder */}
                          <div className="relative flex-shrink-0 w-28 h-16 rounded-md overflow-hidden bg-muted">
                            <img
                              src={movie.poster}
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <Play className="w-6 h-6 text-primary-foreground fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-primary">E{episode.number}</span>
                              <h4 className="text-sm font-medium text-foreground truncate">{episode.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{episode.duration}</p>
                            <p className="text-xs text-muted-foreground/80 line-clamp-2">{episode.description}</p>
                          </div>
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
