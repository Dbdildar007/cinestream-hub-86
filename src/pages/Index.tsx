import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import WatchPartyHistory from "@/components/WatchPartyHistory";
import SeriesModal from "@/components/SeriesModal";
import SeriesVideoPlayer from "@/components/SeriesVideoPlayer";
import { type Movie } from "@/services/movieService";
import { useDownloads } from "@/hooks/useDownloads";
import { useRatings } from "@/hooks/useRatings";
import { useWatchProgress, type WatchProgress } from "@/hooks/useWatchProgress";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchParty } from "@/hooks/useWatchParty";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { useMovies } from '@/hooks/useMovies';
import type { Series, SeriesEpisode } from '@/services/seriesService';
import { seriesService } from '@/services/seriesService';
export default function Index() {
  const { user } = useAuth();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [initialLoad, setInitialLoad] = useState(false);
  const { startDownload, getDownloadState } = useDownloads();
  const { getRating, setRating } = useRatings();
  const { updateProgress, getProgress, getContinueWatching, clearProgress } = useWatchProgress();
  const { isInWatchlist, toggleWatchlist, watchlist } = useWatchlist();
  const { activeParty, isHost, joinParty, syncPlayback, forceSyncPlayback, endParty, onSyncReceived } = useWatchParty();
  const { sendNotification } = useNotifications();

  const { allMovies, categories, featuredMovies, loading } = useMovies();

  // Series state - convert Movie to Series-like for the modal
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [playingSeries, setPlayingSeries] = useState<{ series: Series; episode: SeriesEpisode; season: number } | null>(null);

  //useEffect(() => {
    //const t = setTimeout(() => setInitialLoad(false), 800);
    //return () => clearTimeout(t);
  //}, []);

  // Listen for watch party invites
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("watch-party-invite-listener")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "watch_parties",
        filter: `friend_id=eq.${user.id}`,
      }, async (payload) => {
        const party = payload.new as any;
        if (party.status === "active") {
          const movie = allMovies.find(m => m.id === party.movie_id);
          const joined = await joinParty(party.id);
          if (joined && movie) {
            setPlayingMovie(movie);
            toast.info("You've joined a watch party!");
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, joinParty, allMovies]);

  const continueWatchingMovies = useMemo(() => {
    const progressList = getContinueWatching();
    return progressList
      .map((progress) => {
        const movie = allMovies.find((m) => m.id === progress.movieId);
        if (!movie) return null;
        return { ...movie, progress };
      })
      .filter(Boolean) as (Movie & { progress: { movieId: string; currentTime: number; duration: number; lastWatched: number } })[];
  }, [getContinueWatching, allMovies]);

  const myListMovies = useMemo(() => {
    return watchlist
      .map((id) => allMovies.find((m) => m.id === id))
      .filter(Boolean) as Movie[];
  }, [watchlist, allMovies]);

  // Convert a Movie with isSeries=true to a Series object for the modal
  const movieToSeries = useCallback((movie: Movie): Series => ({
    id: movie.id,
    title: movie.title,
    description: movie.description,
    genre: movie.genre,
    poster_url: movie.poster,
    banner_url: movie.heroImage,
    rating: movie.rating,
    release_year: movie.year,
    is_featured: false,
  }), []);

  const handleCardClick = useCallback((movie: Movie) => {
    if (movie.isSeries) {
      setSelectedSeries(movieToSeries(movie));
    } else {
      setSelectedMovie(movie);
    }
  }, [movieToSeries]);

  const handleWatch = (movie: Movie) => {
    setSelectedMovie(null);
    setPlayingMovie(movie);
  };

  const handlePlaySeriesEpisode = (series: Series, episode: SeriesEpisode, season: number) => {
    setSelectedSeries(null);
    setPlayingSeries({ series, episode, season });
  };

  const handleContinueWatchSeries = useCallback(async (movie: Movie, progress: WatchProgress) => {
    if (!progress.episodeId) {
      // No episode ID, open series modal
      setSelectedSeries(movieToSeries(movie));
      return;
    }
    // Fetch series details to find the episode
    const detail = await seriesService.getSeriesWithSeasons(movie.id);
    if (!detail) return;
    for (const season of detail.seasons) {
      const episode = season.episodes.find(e => e.id === progress.episodeId);
      if (episode) {
        setPlayingSeries({ series: movieToSeries(movie), episode, season: season.number });
        return;
      }
    }
    // Fallback: open modal
    setSelectedSeries(movieToSeries(movie));
  }, [movieToSeries]);

 if (loading && allMovies.length === 0 && !user){
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner fullScreen text="Loading CineStream..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-20 md:pb-0 scrollbar-hide overflow-x-hidden"
    >
      <HeroCarousel
        onMovieSelect={handleCardClick}
        onWatch={handleWatch}
        isInWatchlist={isInWatchlist}
        onToggleWatchlist={toggleWatchlist}
      />

      <div className="-mt-10 md:-mt-35 relative z-10">
        <ContinueWatchingRow
          movies={continueWatchingMovies}
          onWatch={handleWatch}
          onWatchSeries={handleContinueWatchSeries}
          onRemove={clearProgress}
        />

        <WatchPartyHistory />

        {myListMovies.length > 0 && (
          <MovieRow
            title="My List"
            movies={myListMovies}
            onMovieSelect={handleCardClick}
            onDownload={startDownload}
            getDownloadState={getDownloadState}
            getRating={getRating}
            onRate={setRating}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggleWatchlist}
            showRemoveButton={true}
          />
        )}

        {/* All content in unified category rows */}
        {categories.map((category) => (
          <MovieRow
            key={category}
            title={category}
            movies={allMovies.filter(m => m.category.includes(category))}
            onMovieSelect={handleCardClick}
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

      <SeriesModal
        series={selectedSeries}
        onClose={() => setSelectedSeries(null)}
        onPlayEpisode={handlePlaySeriesEpisode}
        userRating={selectedSeries ? getRating(selectedSeries.id) : 0}
        onRate={setRating}
        isInWatchlist={selectedSeries ? isInWatchlist(selectedSeries.id) : false}
        onToggleWatchlist={toggleWatchlist}
      />

      <AnimatePresence>
        {playingMovie && (
          <VideoPlayer
            movie={playingMovie}
            onClose={() => setPlayingMovie(null)}
            onProgressUpdate={updateProgress}
            initialTime={getProgress(playingMovie.id)?.currentTime || 0}
            watchPartyActive={!!activeParty}
            isHost={isHost}
            onSyncPlayback={syncPlayback}
            onForceSyncPlayback={forceSyncPlayback}
            onSyncReceived={onSyncReceived}
            onEndParty={endParty}
            allMovies={allMovies}
            onPlayMovie={(m) => { setPlayingMovie(null); setTimeout(() => setPlayingMovie(m), 100); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playingSeries && (
          <SeriesVideoPlayer
            series={playingSeries.series}
            initialEpisode={playingSeries.episode}
            initialSeason={playingSeries.season}
            onClose={() => setPlayingSeries(null)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </motion.div>
  );
}
