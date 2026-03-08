import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, ChevronLeft } from "lucide-react";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/services/movieService";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import { useRatings } from "@/hooks/useRatings";

const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller", "Crime", "Historical", "Musical"];
const languages = ["English", "Hindi", "Tamil", "Telugu"];

type FolderType = "genre" | "language";

export default function FoldersPage() {
  const { allMovies } = useMovies();
  const [activeTab, setActiveTab] = useState<FolderType>("genre");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const { getRating, setRating } = useRatings();

  const folders = activeTab === "genre" ? genres : languages;
  const getMovies = (folder: string) =>
    activeTab === "genre"
      ? allMovies.filter(m => m.genre.includes(folder))
      : allMovies.filter(m => m.language === folder);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display tracking-wider text-foreground mb-6">BROWSE FOLDERS</h1>

      {/* Tab buttons with proper touch targets */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => { setActiveTab("genre"); setSelectedFolder(null); }}
          className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] active:scale-95 ${
            activeTab === "genre" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          By Genre
        </button>
        <button
          onClick={() => { setActiveTab("language"); setSelectedFolder(null); }}
          className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] active:scale-95 ${
            activeTab === "language" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          By Language
        </button>
      </div>

      {!selectedFolder ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {folders.map((folder) => {
            const count = getMovies(folder).length;
            if (count === 0) return null;
            return (
              <motion.button
                key={folder}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFolder(folder)}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-secondary hover:bg-accent transition-colors min-h-[100px]"
              >
                <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                <span className="text-sm font-medium text-foreground">{folder}</span>
                <span className="text-xs text-muted-foreground">{count} movies</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-6 min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Folders
          </button>
          <MovieRow
            title={selectedFolder}
            movies={getMovies(selectedFolder)}
            onMovieSelect={setSelectedMovie}
            getRating={getRating}
            onRate={setRating}
          />
        </div>
      )}

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        userRating={selectedMovie ? getRating(selectedMovie.id) : 0}
        onRate={setRating}
        onWatch={(movie) => { setSelectedMovie(null); setPlayingMovie(movie); }}
      />

      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
