import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Tv, Plus, CheckCircle } from "lucide-react";
import type { Series } from "@/services/seriesService";

interface SeriesCardProps {
  series: any;
  onSelect: (series: any) => void;
  onRate?: (id: string, rating: number) => void;
  userRating?: number;
  onToggleWatchlist?: (id: string) => void;
  isWatchlisted?: boolean;
}

export default function SeriesCard({
  series,
  onSelect,
  onRate,
  userRating = 0,
  onToggleWatchlist,
  isWatchlisted = false
}: SeriesCardProps) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      className="relative flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(series)}
    >
      <div className="relative rounded-md overflow-hidden aspect-[2/3] bg-secondary border border-border shadow-lg">
        {series.poster_url ? (
          <img
            src={series.poster_url}
            alt={series.title}
            className="w-full h-full object-cover group-hover:brightness-95 transition"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Tv className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-primary/90 px-1.5 py-0.5 rounded text-[10px] font-semibold text-primary-foreground z-10">
          <Tv className="w-2.5 h-2.5" />
          Series
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isMobile ? 1 : (hovered ? 1 : 0) }}
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3"
        >
          <p className="text-[10px] md:text-xs text-muted-foreground">
            {series.release_year} • {series.genre?.join(", ")}
          </p>

          {onRate && (
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRate) onRate(series.id, star);
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
          )}

          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(series.id);
              }}
              className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                isWatchlisted ? "text-primary" : "text-foreground"
              }`}
            >
              {isWatchlisted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isWatchlisted ? "Listed" : "My List"}
            </button>
          )}
        </motion.div>
      </div>

      <h3 className="mt-2 text-xs md:text-sm font-medium text-foreground truncate">
        {series.title}
      </h3>
      <div className="flex items-center gap-1 mt-0.5">
        <Star className="w-3 h-3 text-cine-gold fill-cine-gold" />
        <span className="text-xs text-muted-foreground">{series.rating || "N/A"}</span>
      </div>
    </motion.div>
  );
}
