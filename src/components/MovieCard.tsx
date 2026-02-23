import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Star, Check } from "lucide-react";
import type { Movie } from "@/data/movies";

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onDownload: (movieId: string) => void;
  downloadState?: { progress: number; status: string };
  userRating: number;
  onRate: (movieId: string, rating: number) => void;
}

export default function MovieCard({ movie, onSelect, onDownload, downloadState, userRating, onRate }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(movie)}
    >
      <div className="relative rounded-md overflow-hidden aspect-[2/3] bg-secondary">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent flex flex-col justify-end p-3"
        >
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(movie.id, star);
                }}
                className="p-0"
              >
                <Star
                  className={`w-3 h-3 transition-colors ${
                    star <= userRating ? "text-cine-gold fill-cine-gold" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{movie.year} • {movie.duration}</p>
        </motion.div>

        {/* Download button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(movie.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/70 hover:bg-primary text-foreground transition-colors z-10"
        >
          {downloadState?.status === "complete" ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Download progress */}
        {downloadState?.status === "downloading" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${downloadState.progress}%` }}
            />
          </div>
        )}
      </div>

      <h3 className="mt-2 text-xs md:text-sm font-medium text-foreground truncate">{movie.title}</h3>
      <div className="flex items-center gap-1 mt-0.5">
        <Star className="w-3 h-3 text-cine-gold fill-cine-gold" />
        <span className="text-xs text-muted-foreground">{movie.rating}</span>
      </div>
    </motion.div>
  );
}
