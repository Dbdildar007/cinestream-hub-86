import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, X, Subtitles,
  RotateCcw, ChevronLeft, Lock, Unlock, Cast,
  List, ChevronDown, SkipForward as NextIcon, Users,
  RefreshCw, ChevronUp
} from "lucide-react";
import type { Movie } from "@/data/movies";
import { getSeriesData, type Episode, type Season } from "@/data/series";

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onProgressUpdate?: (movieId: string, currentTime: number, duration: number) => void;
  initialTime?: number;
  watchPartyActive?: boolean;
  isHost?: boolean;
  onSyncPlayback?: (isPlaying: boolean, currentTimeSec: number) => void;
  onForceSyncPlayback?: (isPlaying: boolean, currentTimeSec: number) => void;
  onSyncReceived?: (cb: (state: { isPlaying: boolean; currentTimeSec: number }) => void) => void;
  onEndParty?: () => void;
  guestName?: string;
  allMovies?: Movie[];
  onPlayMovie?: (movie: Movie) => void;
}

export default function VideoPlayer({
  movie, onClose, onProgressUpdate, initialTime = 0,
  watchPartyActive = false, isHost = true,
  onSyncPlayback, onForceSyncPlayback, onSyncReceived, onEndParty, guestName,
  allMovies = [], onPlayMovie,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Episode state
  const seriesInfo = movie.isSeries ? getSeriesData(movie.id) : undefined;
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(
    seriesInfo ? seriesInfo.seasons[0].episodes[0] : null
  );

  // Next episode auto-play
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  // Guest: controls disabled in watch party
  const controlsDisabled = watchPartyActive && !isHost;

  // Check if movie has a valid URL
  const hasValidUrl = !!(movie.url && movie.url.trim() !== '' && movie.url !== '#');

  // Get recommended movies (same genre, exclude current)
  const recommendedMovies = allMovies
    .filter(m => m.id !== movie.id && m.genre.some(g => movie.genre.includes(g)))
    .slice(0, 8);

  // Register sync callback for guest
  useEffect(() => {
    if (!watchPartyActive || isHost || !onSyncReceived) return;
    onSyncReceived((state) => {
      const v = videoRef.current;
      if (!v) return;
      if (Math.abs(v.currentTime - state.currentTimeSec) > 1) {
        v.currentTime = state.currentTimeSec;
      }
      if (state.isPlaying && v.paused) { v.play(); setIsPlaying(true); }
      else if (!state.isPlaying && !v.paused) { v.pause(); setIsPlaying(false); }
    });
  }, [watchPartyActive, isHost, onSyncReceived]);

  // Host: send periodic sync
  const syncIntervalRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (!watchPartyActive || !isHost || !onSyncPlayback) return;
    syncIntervalRef.current = setInterval(() => {
      const v = videoRef.current;
      if (v) onSyncPlayback(!v.paused, v.currentTime);
    }, 2000);
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [watchPartyActive, isHost, onSyncPlayback]);

  const getNextEpisode = useCallback((): Episode | null => {
    if (!seriesInfo || !currentEpisode) return null;
    const currentSeasonData = seriesInfo.seasons.find(s => s.number === selectedSeason);
    if (!currentSeasonData) return null;
    const currentIdx = currentSeasonData.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIdx < currentSeasonData.episodes.length - 1) return currentSeasonData.episodes[currentIdx + 1];
    const nextSeason = seriesInfo.seasons.find(s => s.number === selectedSeason + 1);
    if (nextSeason && nextSeason.episodes.length > 0) return nextSeason.episodes[0];
    return null;
  }, [seriesInfo, currentEpisode, selectedSeason]);

  // Save progress periodically
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (!hasValidUrl) return;
    progressIntervalRef.current = setInterval(() => {
      const v = videoRef.current;
      if (v && v.duration > 0 && onProgressUpdate) {
        onProgressUpdate(movie.id, v.currentTime, v.duration);
      }
    }, 5000);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [movie.id, onProgressUpdate, hasValidUrl]);

  const handleClose = () => {
    const v = videoRef.current;
    if (v && v.duration > 0 && onProgressUpdate) {
      onProgressUpdate(movie.id, v.currentTime, v.duration);
    }
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (watchPartyActive && onEndParty) onEndParty();
    onClose();
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    }
  }, [isPlaying, isLocked]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying, resetControlsTimer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked || controlsDisabled) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": skip(10); break;
        case "ArrowLeft": skip(-10); break;
        case "ArrowUp": e.preventDefault(); adjustVolume(0.1); break;
        case "ArrowDown": e.preventDefault(); adjustVolume(-0.1); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
        case "n": { const next = getNextEpisode(); if (next) playEpisode(next); break; }
        case "Escape":
          if (showRecommendations) setShowRecommendations(false);
          else if (showNextEpisode) setShowNextEpisode(false);
          else if (showEpisodes) setShowEpisodes(false);
          else if (isFullscreen) toggleFullscreen();
          else handleClose();
          break;
      }
      resetControlsTimer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLocked, isFullscreen, volume, isPlaying, showEpisodes, showNextEpisode, controlsDisabled, showRecommendations]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoEnded(true);
    const next = getNextEpisode();
    if (next) {
      setShowNextEpisode(true);
      setNextEpisodeCountdown(10);
      countdownRef.current = setInterval(() => {
        setNextEpisodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            playEpisode(next);
            setShowNextEpisode(false);
            setVideoEnded(false);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // No next episode - show recommendations
      setShowRecommendations(true);
    }
  }, [getNextEpisode]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const togglePlay = () => {
    if (controlsDisabled) return;
    if (videoEnded) {
      // Replay
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.play();
        setIsPlaying(true);
        setVideoEnded(false);
        setShowRecommendations(false);
      }
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
    if (watchPartyActive && isHost && onForceSyncPlayback) {
      onForceSyncPlayback(!v.paused, v.currentTime);
    }
  };

  const skip = (seconds: number) => {
    if (controlsDisabled) return;
    const v = videoRef.current;
    if (v) {
      v.currentTime = Math.max(0, Math.min(v.currentTime + seconds, duration));
      if (watchPartyActive && isHost && onForceSyncPlayback) {
        onForceSyncPlayback(!v.paused, v.currentTime);
      }
    }
  };

  const adjustVolume = (delta: number) => {
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    if (videoRef.current) videoRef.current.volume = newVol;
    if (newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || isSeeking) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (controlsDisabled) return;
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
    if (watchPartyActive && isHost && onForceSyncPlayback) {
      onForceSyncPlayback(isPlaying, time);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);

  const handleScreenTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) { resetControlsTimer(); return; }
    if (showEpisodes || showNextEpisode || showRecommendations) return;
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const relX = rect ? (clientX - rect.left) / rect.width : 0.5;

    if (now - lastTapRef.current.time < 300) {
      if (controlsDisabled) return;
      if (relX < 0.35) { skip(-10); setDoubleTapSide("left"); }
      else if (relX > 0.65) { skip(10); setDoubleTapSide("right"); }
      else { togglePlay(); }
      setTimeout(() => setDoubleTapSide(null), 600);
    } else {
      resetControlsTimer();
    }
    lastTapRef.current = { time: now, x: clientX };
  };

  const playEpisode = (episode: Episode) => {
    if (controlsDisabled) return;
    setCurrentEpisode(episode);
    setShowEpisodes(false);
    setShowNextEpisode(false);
    setVideoEnded(false);
    setShowRecommendations(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (seriesInfo) {
      const season = seriesInfo.seasons.find(s => s.episodes.some(e => e.id === episode.id));
      if (season) setSelectedSeason(season.number);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  const cancelNextEpisode = () => {
    setShowNextEpisode(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handlePlayRecommended = (rec: Movie) => {
    if (onPlayMovie) {
      onPlayMovie(rec);
    }
  };

  const currentSeasonData = seriesInfo?.seasons.find((s) => s.number === selectedSeason);
  const nextEpisode = getNextEpisode();

  // No valid URL - show unavailable screen
  if (!hasValidUrl && !movie.isSeries) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center text-white p-6 text-center"
      >
        <div className="bg-secondary/20 p-8 rounded-2xl border border-white/10 backdrop-blur-md max-w-sm w-full">
          <p className="text-xl font-semibold mb-4">Movie Unavailable</p>
          <p className="text-muted-foreground mb-6 text-sm">We couldn't find the video file for "{movie.title}" in our database.</p>
          
          {/* Show recommendations */}
          {recommendedMovies.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3">You might like</p>
              <div className="grid grid-cols-3 gap-2">
                {recommendedMovies.slice(0, 3).map(rec => (
                  <button
                    key={rec.id}
                    onClick={() => handlePlayRecommended(rec)}
                    className="rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                  >
                    <img src={rec.poster} alt={rec.title} className="w-full aspect-[2/3] object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={onClose} 
            className="w-full px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition-transform"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      style={{ filter: `brightness(${brightness}%)` }}
      onClick={handleScreenTap}
      onMouseMove={resetControlsTimer}
    >
      <video
        ref={videoRef}
        key={movie.url}
        src={movie.url}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) {
            setDuration(v.duration);
            if (initialTime > 0) v.currentTime = initialTime;
          }
        }}
        onEnded={handleVideoEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {/* Buffering loader */}
      <AnimatePresence>
        {isBuffering && !videoEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-[103] pointer-events-none"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="text-xs text-foreground/70">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch party indicator */}
      {watchPartyActive && (
        <div className="absolute top-4 right-16 z-[112] flex items-center gap-2 bg-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <Users className="w-3.5 h-3.5 text-primary-foreground" />
          <span className="text-xs font-medium text-primary-foreground">
            {isHost ? `Hosting${guestName ? ` • ${guestName}` : ""}` : "Watching together"}
          </span>
        </div>
      )}

      {/* Guest overlay */}
      {controlsDisabled && showControls && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[108] bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-xs text-muted-foreground">Host is controlling playback</p>
        </div>
      )}

      {/* Double tap indicators */}
      <AnimatePresence>
        {doubleTapSide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/2 -translate-y-1/2 ${
              doubleTapSide === "left" ? "left-[15%]" : "right-[15%]"
            } flex flex-col items-center gap-1 pointer-events-none`}
          >
            <RotateCcw className={`w-8 h-8 text-foreground ${doubleTapSide === "right" ? "rotate-180 scale-x-[-1]" : ""}`} />
            <span className="text-xs text-foreground font-medium">10s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock screen overlay */}
      {isLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLocked(false); resetControlsTimer(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground text-sm"
          >
            <Lock className="w-4 h-4" />
            Tap to unlock
          </button>
        </div>
      )}

      {/* Recommendations Bottom Sheet */}
      <AnimatePresence>
        {(showRecommendations || videoEnded) && recommendedMovies.length > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[120] max-h-[70vh] bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
            </div>
            
            {/* Header with replay button */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h3 className="text-foreground font-semibold text-base">
                  {videoEnded ? "What's Next?" : "Recommended"}
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Based on {movie.title}
                </p>
              </div>
              <div className="flex gap-2">
                {videoEnded && (
                  <button
                    onClick={togglePlay}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replay
                  </button>
                )}
                <button
                  onClick={() => { setShowRecommendations(false); if (videoEnded) setVideoEnded(false); }}
                  className="p-2 rounded-full hover:bg-muted/30 transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable grid */}
            <div className="px-5 pb-8 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {recommendedMovies.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handlePlayRecommended(rec)}
                    className="group text-left rounded-lg overflow-hidden bg-secondary/30 hover:bg-secondary/60 transition-all hover:scale-[1.03]"
                  >
                    <div className="relative aspect-[2/3]">
                      <img src={rec.poster} alt={rec.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                      {rec.rating > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-primary font-bold">
                          {rec.rating}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-foreground text-xs font-medium truncate">{rec.title}</p>
                      <p className="text-muted-foreground text-[10px]">{rec.year} • {rec.genre[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations peek arrow (during playback) */}
      {!videoEnded && !showRecommendations && recommendedMovies.length > 0 && showControls && !isLocked && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowRecommendations(true); }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[106] flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm text-foreground text-xs hover:bg-card/80 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          More like this
        </button>
      )}

      {/* Next Episode Auto-play Overlay */}
      <AnimatePresence>
        {showNextEpisode && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 md:right-8 z-[115] w-[260px] md:w-[340px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border overflow-hidden shadow-2xl">
              <div className="relative aspect-video bg-secondary">
                <img src={movie.poster} alt="Next episode" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-muted-foreground mb-1">Next Episode</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    E{nextEpisode.number}: {nextEpisode.title}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                        <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                          strokeDasharray={`${(nextEpisodeCountdown / 10) * 88} 88`} strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                        {nextEpisodeCountdown}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Playing in {nextEpisodeCountdown}s</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => playEpisode(nextEpisode)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-semibold text-xs transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                  </button>
                  <button onClick={cancelNextEpisode}
                    className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[105]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gradient + controls */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-3 pb-12 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-foreground font-semibold text-sm md:text-base truncate">
                    {movie.title}
                    {currentEpisode && (
                      <span className="text-muted-foreground font-normal"> — S{selectedSeason} E{currentEpisode.number}</span>
                    )}
                  </h2>
                  <p className="text-muted-foreground text-xs truncate">
                    {currentEpisode ? currentEpisode.title : `${movie.year} • ${movie.genre.join(", ")} • ${movie.language}`}
                  </p>
                </div>
                {seriesInfo && (
                  <button onClick={() => setShowEpisodes(!showEpisodes)} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                    <List className="w-5 h-5 text-foreground" />
                  </button>
                )}
                {nextEpisode && !controlsDisabled && (
                  <button onClick={() => playEpisode(nextEpisode)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 text-foreground text-xs font-medium transition-colors">
                    <NextIcon className="w-4 h-4" /> Next
                  </button>
                )}
                <button onClick={() => setIsLocked(true)} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <Unlock className="w-5 h-5 text-foreground" />
                </button>
                <button className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <Cast className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Center play/pause/replay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 md:gap-12">
              <button onClick={() => skip(-10)} disabled={controlsDisabled} className="p-3 rounded-full bg-background/30 hover:bg-background/50 transition-colors disabled:opacity-40">
                <SkipBack className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </button>
              <button onClick={togglePlay} disabled={controlsDisabled} className="p-4 md:p-5 rounded-full bg-primary/90 hover:bg-primary transition-colors disabled:opacity-40">
                {videoEnded ? (
                  <RefreshCw className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                ) : (
                  <Play className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground fill-current" />
                )}
              </button>
              <button onClick={() => skip(10)} disabled={controlsDisabled} className="p-3 rounded-full bg-background/30 hover:bg-background/50 transition-colors disabled:opacity-40">
                <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-4 px-4 md:px-6">
              {/* Progress bar */}
              <div className="relative group mb-3">
                <div className="h-1 group-hover:h-2 transition-all bg-muted/40 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-full" style={{ width: `${bufferedPercent}%` }} />
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                  onChange={handleSeek} disabled={controlsDisabled}
                  onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)}
                  onTouchStart={() => setIsSeeking(true)} onTouchEnd={() => setIsSeeking(false)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <button onClick={togglePlay} disabled={controlsDisabled} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden disabled:opacity-40">
                    {videoEnded ? <RefreshCw className="w-5 h-5 text-foreground" /> :
                     isPlaying ? <Pause className="w-5 h-5 text-foreground" /> : <Play className="w-5 h-5 text-foreground fill-current" />}
                  </button>
                  {nextEpisode && !controlsDisabled && (
                    <button onClick={() => playEpisode(nextEpisode)} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                      <NextIcon className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                  <div className="hidden md:flex items-center gap-1 relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                    <button onClick={toggleMute} className="p-1.5 hover:bg-muted/30 rounded transition-colors">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
                    </button>
                    {showVolumeSlider && (
                      <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                        onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; if (v > 0) setIsMuted(false); }}
                        className="w-20 h-1 accent-primary" />
                    )}
                  </div>
                  <span className="text-xs text-foreground/80 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  {watchPartyActive && isHost && onEndParty && (
                    <button onClick={(e) => { e.stopPropagation(); onEndParty(); }}
                      className="px-2 py-1 rounded bg-destructive/80 hover:bg-destructive text-destructive-foreground text-[10px] font-medium transition-colors">
                      End Party
                    </button>
                  )}
                  {seriesInfo && (
                    <button onClick={() => setShowEpisodes(!showEpisodes)} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                      <List className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                  <div className="relative">
                    <button onClick={() => { setShowSubtitleMenu(!showSubtitleMenu); setShowSpeedMenu(false); }}
                      className={`p-1.5 rounded transition-colors ${subtitlesOn ? "bg-primary/30 text-primary" : "hover:bg-muted/30 text-foreground"}`}>
                      <Subtitles className="w-5 h-5" />
                    </button>
                    {showSubtitleMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg p-2 min-w-[140px] shadow-lg">
                        <p className="text-xs text-muted-foreground px-2 mb-1">Subtitles</p>
                        {["Off", "English", "Hindi"].map((lang) => (
                          <button key={lang} onClick={() => { setSubtitlesOn(lang !== "Off"); setShowSubtitleMenu(false); }}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                              (lang === "Off" && !subtitlesOn) || (lang === "English" && subtitlesOn) ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/30"
                            }`}>{lang}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSubtitleMenu(false); }} className="p-1.5 hover:bg-muted/30 rounded transition-colors">
                      <Settings className="w-5 h-5 text-foreground" />
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg p-2 min-w-[120px] shadow-lg">
                        <p className="text-xs text-muted-foreground px-2 mb-1">Speed</p>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button key={speed} onClick={() => changeSpeed(speed)}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                              playbackSpeed === speed ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/30"
                            }`}>{speed}x</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={toggleMute} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
                  </button>
                  <button onClick={toggleFullscreen} className="p-1.5 hover:bg-muted/30 rounded transition-colors">
                    {isFullscreen ? <Minimize className="w-5 h-5 text-foreground" /> : <Maximize className="w-5 h-5 text-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Selector Panel */}
      <AnimatePresence>
        {showEpisodes && seriesInfo && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 z-[110] w-full md:w-[380px] bg-card/95 backdrop-blur-md border-l border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="text-foreground font-semibold text-base">Episodes</h3>
              <button onClick={() => setShowEpisodes(false)} className="p-1.5 rounded-full hover:bg-muted/30 transition-colors">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {seriesInfo.seasons.length > 1 && (
              <div className="px-4 py-3 border-b border-border">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {seriesInfo.seasons.map((season) => (
                    <button key={season.number} onClick={() => setSelectedSeason(season.number)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedSeason === season.number ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}>
                      Season {season.number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              {currentSeasonData?.episodes.map((episode) => {
                const isActive = currentEpisode?.id === episode.id;
                return (
                  <button key={episode.id} onClick={() => !controlsDisabled && playEpisode(episode)}
                    disabled={controlsDisabled}
                    className={`w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50 ${
                      isActive ? "bg-primary/15 border border-primary/30" : "bg-secondary/50 hover:bg-secondary border border-transparent"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>{episode.number}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                            {episode.title}
                          </h4>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{episode.duration}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{episode.description}</p>
                        {isActive && (
                          <div className="flex items-center gap-1 mt-2 text-primary">
                            <Play className="w-3 h-3 fill-current" />
                            <span className="text-xs font-medium">Now Playing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
