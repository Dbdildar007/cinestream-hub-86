import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Film } from "lucide-react";
import { genres, languages, getMoviesByGenre, getMoviesByLanguage, type Movie } from "@/data/movies";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import { useDownloads } from "@/hooks/useDownloads";
import { useRatings } from "@/hooks/useRatings";

type FolderType = "genre" | "language";

export default function FoldersPage() {
  const [activeTab, setActiveTab] = useState<FolderType>("genre");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const { startDownload, getDownloadState } = useDownloads();
  const { getRating, setRating } = useRatings();

  const folders = activeTab === "genre" ? genres : languages;
  const getMovies = activeTab === "genre" ? getMoviesByGenre : getMoviesByLanguage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-20 md:pt-24 px-4 md:px-12 pb-24"
    >
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-foreground mb-6">BROWSE FOLDERS</h1>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => { setActiveTab("genre"); setSelectedFolder(null); }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "genre" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          By Genre
        </button>
        <button
          onClick={() => { setActiveTab("language"); setSelectedFolder(null); }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "language" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          By Language
        </button>
      </div>

      {!selectedFolder ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {folders.map((folder) => {
            const count = getMovies(folder).length;
            if (count === 0) return null;
            return (
              <motion.button
                key={folder}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFolder(folder)}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-secondary hover:bg-cine-surface-hover transition-colors"
              >
                <Folder className="w-10 h-10 text-primary" />
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
            className="text-sm text-primary hover:underline mb-6 inline-block"
          >
            ← Back to Folders
          </button>
          <MovieRow
            title={selectedFolder}
            movies={getMovies(selectedFolder)}
            onMovieSelect={setSelectedMovie}
            onDownload={startDownload}
            getDownloadState={getDownloadState}
            getRating={getRating}
            onRate={setRating}
          />
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
    </motion.div>
  );
}
