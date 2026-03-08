import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Plus, CheckCircle, Tv } from "lucide-react";
import type { Movie } from "@/services/movieService";

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  userRating: number;
  onRate: (movieId: string, rating: number) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (movieId: string) => void;
  /** When true, card fills its container width instead of using fixed width */
  fillWidth?: boolean;
}

export default function MovieCard({ movie, onSelect, userRating, onRate, isInWatchlist, onToggleWatchlist, fillWidth }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      className={`relative group cursor-pointer ${
        fillWidth ? "w-full" : "flex-shrink-0 w-[140px] md:w-[180px]"
      }`}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(movie)}
    >
      <div className="relative rounded-md overflow-hidden aspect-[2/3] bg-secondary border border-border">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:brightness-95 transition"
          loading="lazy"
        />

        {/* Series badge */}
        {movie.isSeries && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-primary/90 px-1.5 py-0.5 rounded text-[10px] font-semibold text-primary-foreground z-10">
            <Tv className="w-2.5 h-2.5" />
            Series
          </div>
        )}

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isMobile ? 1 : (hovered ? 1 : 0) }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex flex-col justify-end p-3 transition-opacity"
        >
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRate) onRate(movie.id, star);
                }}
                className="p-1.5 -m-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
                <Star
                  className={`w-3.5 h-3.5 transition-colors ${
                    star <= userRating ? "text-cine-gold fill-cine-gold" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{movie.year} • {movie.duration}</p>

          {/* Watchlist button on hover */}
          {onToggleWatchlist && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie.id); }}
              className={`mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                isInWatchlist ? "text-primary" : "text-foreground"
              }`}
            >
              {isInWatchlist ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isInWatchlist ? "Listed" : "My List"}
            </button>
          )}
        </motion.div>
      </div>

      <h3 className="mt-2 text-xs md:text-sm font-medium text-foreground truncate">{movie.title}</h3>
      <div className="flex items-center gap-1 mt-0.5">
        <Star className="w-3 h-3 text-cine-gold fill-cine-gold" />
        <span className="text-xs text-muted-foreground">{movie.rating}</span>
      </div>
    </motion.div>
  );
}
