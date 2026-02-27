import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import { categories, getMoviesByCategory, allMovies, type Movie } from "@/data/movies";
import { useDownloads } from "@/hooks/useDownloads";
import { useRatings } from "@/hooks/useRatings";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useWatchlist } from "@/hooks/useWatchlist";

export default function Index() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const { startDownload, getDownloadState } = useDownloads();
  const { getRating, setRating } = useRatings();
  const { updateProgress, getProgress, getContinueWatching, clearProgress } = useWatchProgress();
  const { isInWatchlist, toggleWatchlist, watchlist } = useWatchlist();

  const continueWatchingMovies = useMemo(() => {
    const progressList = getContinueWatching();
    return progressList
      .map((progress) => {
        const movie = allMovies.find((m) => m.id === progress.movieId);
        if (!movie) return null;
        return { ...movie, progress };
      })
      .filter(Boolean) as (Movie & { progress: { movieId: string; currentTime: number; duration: number; lastWatched: number } })[];
  }, [getContinueWatching]);

  // My List row
  const myListMovies = useMemo(() => {
    return watchlist
      .map((id) => allMovies.find((m) => m.id === id))
      .filter(Boolean) as Movie[];
  }, [watchlist]);

  const handleWatch = (movie: Movie) => {
    setSelectedMovie(null);
    setPlayingMovie(movie);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-20 md:pb-0"
    >
      <HeroCarousel
        onMovieSelect={setSelectedMovie}
        onWatch={handleWatch}
        isInWatchlist={isInWatchlist}
        onToggleWatchlist={toggleWatchlist}
      />

      <div className="-mt-10 md:-mt-20 relative z-10">
        <ContinueWatchingRow
          movies={continueWatchingMovies}
          onWatch={handleWatch}
          onRemove={clearProgress}
        />

        {/* My List row */}
        {myListMovies.length > 0 && (
          <MovieRow
            title="My List"
            movies={myListMovies}
            onMovieSelect={setSelectedMovie}
            onDownload={startDownload}
            getDownloadState={getDownloadState}
            getRating={getRating}
            onRate={setRating}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        )}

        {categories.map((category) => (
          <MovieRow
            key={category}
            title={category}
            movies={getMoviesByCategory(category)}
            onMovieSelect={setSelectedMovie}
            onDownload={startDownload}
            getDownloadState={getDownloadState}
            getRating={getRating}
            onRate={setRating}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        ))}
      </div>

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onDownload={startDownload}
        downloadState={selectedMovie ? getDownloadState(selectedMovie.id) : undefined}
        userRating={selectedMovie ? getRating(selectedMovie.id) : 0}
        onRate={setRating}
        onWatch={handleWatch}
        isInWatchlist={selectedMovie ? isInWatchlist(selectedMovie.id) : false}
        onToggleWatchlist={toggleWatchlist}
      />

      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer
            movie={playingMovie}
            onClose={() => setPlayingMovie(null)}
            onProgressUpdate={updateProgress}
            initialTime={getProgress(playingMovie.id)?.currentTime || 0}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
