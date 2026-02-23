import { useState } from "react";
import { motion } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import { categories, getMoviesByCategory, type Movie } from "@/data/movies";
import { useDownloads } from "@/hooks/useDownloads";
import { useRatings } from "@/hooks/useRatings";

export default function Index() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { startDownload, getDownloadState } = useDownloads();
  const { getRating, setRating } = useRatings();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-20 md:pb-0"
    >
      <HeroCarousel onMovieSelect={setSelectedMovie} />

      <div className="-mt-20 relative z-10">
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
      />
    </motion.div>
  );
}
