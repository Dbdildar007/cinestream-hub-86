import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight, Plus, CheckCircle } from "lucide-react";
import { useFeaturedMovies } from "@/hooks/useMovies";
import type { Movie } from "@/services/movieService";
import { HeroSkeleton } from "@/components/LoadingSpinner";

interface HeroCarouselProps {
  onMovieSelect: (movie: Movie) => void;
  onWatch?: (movie: Movie) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movieId: string) => void;
}

export default function HeroCarousel({ onMovieSelect, onWatch, isInWatchlist, onToggleWatchlist }: HeroCarouselProps) {
  const { movies: featuredMovies, loading } = useFeaturedMovies();
  const [current, setCurrent] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  const next = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrent((c) => (c + 1) % featuredMovies.length);
  }, [featuredMovies.length]);

  const prev = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrent((c) => (c - 1 + featuredMovies.length) % featuredMovies.length);
  }, [featuredMovies.length]);

  useEffect(() => {
    if (featuredMovies.length === 0) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, featuredMovies.length]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartRef.current = null;
  };

  if (loading || featuredMovies.length === 0) {
    return <HeroSkeleton />;
  }

  const movie = featuredMovies[current];
  const inList = isInWatchlist?.(movie.id);

  return (
    <div
      className="relative w-full h-[65vh] sm:h-[70vh] md:h-[85vh] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={movie.heroImage || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover brightness-95"
            style={{ aspectRatio: "16 / 9" }}
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-[12%] sm:bottom-[10%] md:bottom-[14%] left-0 right-0 px-4 sm:px-6 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-display tracking-wider text-foreground mb-2 sm:mb-3">
              {movie.title.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="text-primary font-semibold">{movie.rating}/10</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{movie.genre.join(", ")}</span>
              {movie.isSeries && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">Series</span>
                </>
              )}
            </div>
            <p className="text-foreground/80 max-w-lg text-xs sm:text-sm md:text-base mb-4 sm:mb-6 line-clamp-2 md:line-clamp-none">
              {movie.description}
            </p>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => onWatch?.(movie)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold text-sm transition-colors active:scale-95 min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </button>
              <button
                onClick={() => onMovieSelect(movie)}
                className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold text-sm transition-colors backdrop-blur-sm active:scale-95 min-h-[44px]"
              >
                <Info className="w-4 h-4" />
                More Info
              </button>
              <button
                onClick={() => onToggleWatchlist?.(movie.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md font-semibold text-sm transition-colors backdrop-blur-sm active:scale-95 min-h-[44px] ${
                  inList
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                }`}
              >
                {inList ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="hidden sm:inline">{inList ? "Listed" : "My List"}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="absolute hidden sm:flex bottom-14 md:bottom-5 left-1/2 -translate-x-1/2 gap-1 md:gap-1.5">
        {featuredMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-[2px] sm:h-[3px] md:h-1 rounded-full transition-all duration-300 min-w-[8px] sm:min-w-[10px] md:min-w-[10px] min-h-[8px] sm:min-h-[10px] md:min-h-[10px] flex items-center justify-center p-0 ${
              i === current ? "w-3 sm:w-4 md:w-5 bg-primary" : "w-1.5 sm:w-2 md:w-2.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Desktop nav arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex p-3 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex p-3 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>
    </div>
  );
}
