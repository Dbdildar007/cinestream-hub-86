import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/data/movies";
import MovieCard from "./MovieCard";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieSelect: (movie: Movie) => void;
  onDownload: (movieId: string) => void;
  getDownloadState: (movieId: string) => { progress: number; status: string } | undefined;
  getRating: (movieId: string) => number;
  onRate: (movieId: string, rating: number) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movieId: string) => void;
}

export default function MovieRow({
  title, movies, onMovieSelect, onDownload, getDownloadState, getRating, onRate,
  isInWatchlist, onToggleWatchlist,
}: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (movies.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative px-4 md:px-12 mb-8"
    >
      <h2 className="text-xl md:text-2xl font-display tracking-wide text-foreground mb-4">
        {title.toUpperCase()}
      </h2>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onMovieSelect}
              onDownload={onDownload}
              downloadState={getDownloadState(movie.id)}
              userRating={getRating(movie.id)}
              onRate={onRate}
              isInWatchlist={isInWatchlist?.(movie.id)}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
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
