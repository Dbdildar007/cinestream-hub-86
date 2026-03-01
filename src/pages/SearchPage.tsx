import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/data/movies";
import { genres, languages } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import { useDownloads } from "@/hooks/useDownloads";
import { useRatings } from "@/hooks/useRatings";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SearchPage() {
  const { allMovies, loading } = useMovies();
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const { startDownload, getDownloadState } = useDownloads();
  const { getRating, setRating } = useRatings();

  const years = ["2025", "2024", "2023"];
  const ratingFilters = ["8+", "7+", "6+"];

  const filtered = useMemo(() => {
    return allMovies.filter((m) => {
      if (query && !m.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedGenre && !m.genre.includes(selectedGenre)) return false;
      if (selectedYear && m.year !== parseInt(selectedYear)) return false;
      if (selectedRating) {
        const min = parseInt(selectedRating);
        if (m.rating < min) return false;
      }
      return true;
    });
  }, [query, selectedGenre, selectedYear, selectedRating, allMovies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <LoadingSpinner fullScreen text="Loading movies..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24 overflow-x-hidden"
    >
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedGenre === g
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-8 pb-1">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(selectedYear === y ? null : y)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedYear === y
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {y}
          </button>
        ))}
        {ratingFilters.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRating(selectedRating === r ? null : r)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedRating === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            ★ {r}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} results</p>
     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 sm:gap-6">
        {filtered.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={setSelectedMovie}
            onDownload={startDownload}
            downloadState={getDownloadState(movie.id)}
            userRating={getRating(movie.id)}
            onRate={setRating}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No movies found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onDownload={startDownload}
        downloadState={selectedMovie ? getDownloadState(selectedMovie.id) : undefined}
        userRating={selectedMovie ? getRating(selectedMovie.id) : 0}
        onRate={setRating}
        onWatch={(movie) => { setSelectedMovie(null); setPlayingMovie(movie); }}
      />

      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
        )}
      </AnimatePresence>
      <Footer />
    </motion.div>
  );
}
