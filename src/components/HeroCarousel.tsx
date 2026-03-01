import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight, Plus, CheckCircle } from "lucide-react";
import { useFeaturedMovies } from "@/hooks/useMovies";
import type { Movie } from "@/data/movies";
import LoadingSpinner from "@/components/LoadingSpinner";

interface HeroCarouselProps {
  onMovieSelect: (movie: Movie) => void;
  onWatch?: (movie: Movie) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movieId: string) => void;
}

export default function HeroCarousel({ onMovieSelect, onWatch, isInWatchlist, onToggleWatchlist }: HeroCarouselProps) {
  const { movies: featuredMovies, loading } = useFeaturedMovies();
  const [current, setCurrent] = useState(0);

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

  if (loading || featuredMovies.length === 0) {
    return (
      <div className="relative w-full h-[70vh] md:h-[85vh] bg-background flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  const movie = featuredMovies[current];
  const inList = isInWatchlist?.(movie.id);

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
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
            className="w-full h-full object-cover" 
            style={{ aspectRatio: "2752 / 1536" }}
            loading="eager" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-[15%] md:bottom-[20%] left-0 right-0 px-6 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-7xl font-display tracking-wider text-foreground mb-3">
              {movie.title.toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground flex-wrap">
              <span className="text-primary font-semibold">{movie.rating}/10</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span>{movie.genre.join(", ")}</span>
              {movie.isSeries && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">Series</span>
                </>
              )}
            </div>
            <p className="text-foreground/80 max-w-lg text-sm md:text-base mb-6 line-clamp-2 md:line-clamp-none">
              {movie.description}
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onWatch?.(movie)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-semibold text-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </button>
              <button
                onClick={() => onMovieSelect(movie)}
                className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-semibold text-sm transition-colors backdrop-blur-sm"
              >
                <Info className="w-4 h-4" />
                More Info
              </button>
              <button
                onClick={() => onToggleWatchlist?.(movie.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-md font-semibold text-sm transition-colors backdrop-blur-sm ${
                  inList
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                }`}
              >
                {inList ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="hidden md:inline">{inList ? "Listed" : "My List"}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>
    </div>
  );
}
