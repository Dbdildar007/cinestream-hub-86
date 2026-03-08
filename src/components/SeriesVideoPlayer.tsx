import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, X, ChevronLeft, ChevronUp,
  Lock, Unlock, List, SkipForward as NextIcon, 
  RefreshCw, AlertCircle, Subtitles, Users, Loader2
} from "lucide-react";
import type { Series, SeriesEpisode } from "@/services/seriesService";
import { useSeriesDetail, useAllSeries } from "@/hooks/useSeries";
import { useWatchProgress } from '@/hooks/useWatchProgress'; 
import type { PartyPhase } from "@/hooks/useWatchParty";

interface SeriesVideoPlayerProps {
  series: Series;
  initialEpisode: SeriesEpisode;
  initialSeason: number;
  initialTime?: number;
  onClose: () => void;
  watchPartyActive?: boolean;
  isHost?: boolean;
  onSyncPlayback?: (isPlaying: boolean, currentTimeSec: number) => void;
  onForceSyncPlayback?: (isPlaying: boolean, currentTimeSec: number) => void;
  onSyncReceived?: (cb: (state: { isPlaying: boolean; currentTimeSec: number }) => void) => void;
  onEndParty?: (currentTimeSec: number, durationSec: number) => void;
  guestName?: string;
  partyPhase?: PartyPhase;
  onEpisodeChangeReceived?: (cb: (data: { episode: SeriesEpisode; seasonNumber: number }) => void) => void;
  broadcastEpisodeChange?: (episode: SeriesEpisode, seasonNumber: number) => void;
}

export default function SeriesVideoPlayer({
  series, initialEpisode, initialSeason, initialTime, onClose,
  watchPartyActive = false, isHost = true,
  onSyncPlayback, onForceSyncPlayback, onSyncReceived, onEndParty, guestName,
  partyPhase, onEpisodeChangeReceived, broadcastEpisodeChange,
}: SeriesVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const lastSavedTimeRef = useRef<number>(0);

  const { series: seriesDetail } = useSeriesDetail(series.id);
  const { updateProgress, getProgress } = useWatchProgress();

  const controlsDisabled = watchPartyActive && !isHost;
  const shouldAutoPlay = !watchPartyActive || partyPhase === "playing";

  const [currentEpisode, setCurrentEpisode] = useState<SeriesEpisode>(initialEpisode);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [isPlaying, setIsPlaying] = useState(shouldAutoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(5);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { allSeries } = useAllSeries();
  const recommendedSeries = allSeries
    .filter(s => s.id !== series.id && s.genre.some(g => series.genre.includes(g)))
    .slice(0, 8);

  const hasValidUrl = !!(currentEpisode.video_url && currentEpisode.video_url.trim() !== '');

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || isSeeking) return;
    
    setCurrentTime(v.currentTime);
    
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }

    // Check if we have the IDs needed
    if (series?.id && currentEpisode?.id && v.duration > 0) {
      // 1. We still use lastSavedTimeRef to avoid spamming the DATABASE...
      if (v.currentTime > 5 && (Math.abs(v.currentTime - lastSavedTimeRef.current) > 5 || v.ended)) {
  lastSavedTimeRef.current = v.currentTime;
  
  updateProgress(
    series.id,
    v.currentTime,
    v.duration,
    'series',
    currentEpisode.id,
    selectedSeason
  );
}
    }
  }, [series?.id, currentEpisode?.id, isSeeking, updateProgress]);

  const initialTimeUsedRef = useRef(false);

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    // Use override initialTime first (e.g. from watch party history), only once
    if (initialTime && initialTime > 5 && !initialTimeUsedRef.current) {
      initialTimeUsedRef.current = true;
      v.currentTime = initialTime;
      return;
    }
    // Resume from saved progress
    const saved = getProgress(series.id, currentEpisode.id);
    if (saved && saved.currentTime > 5 && saved.currentTime / v.duration < 0.95) {
      v.currentTime = saved.currentTime;
    }
  };

  const getNextEpisode = useCallback((): SeriesEpisode | null => {
    if (!seriesDetail) return null;
    const currentSeasonData = seriesDetail.seasons.find(s => s.number === selectedSeason);
    if (!currentSeasonData) return null;
    const currentIdx = currentSeasonData.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIdx < currentSeasonData.episodes.length - 1) {
      return currentSeasonData.episodes[currentIdx + 1];
    }
    const nextSeason = seriesDetail.seasons.find(s => s.number === selectedSeason + 1);
    if (nextSeason && nextSeason.episodes.length > 0) {
      return nextSeason.episodes[0];
    }
    return null;
  }, [seriesDetail, currentEpisode, selectedSeason]);

  const nextEpisode = getNextEpisode();

  const playEpisode = useCallback((episode: SeriesEpisode) => {
    if (controlsDisabled) return;
    setCurrentEpisode(episode);
    setShowEpisodes(false);
    setShowNextEpisode(false);
    setVideoEnded(false);
    lastSavedTimeRef.current = 0;
    if (countdownRef.current) clearInterval(countdownRef.current);
    let seasonNum = selectedSeason;
    if (seriesDetail) {
      const season = seriesDetail.seasons.find(s => s.episodes.some(e => e.id === episode.id));
      if (season) { setSelectedSeason(season.number); seasonNum = season.number; }
    }
    // Host broadcasts episode change
    if (watchPartyActive && isHost && broadcastEpisodeChange) {
      broadcastEpisodeChange(episode, seasonNum);
    }
  }, [seriesDetail, controlsDisabled, watchPartyActive, isHost, broadcastEpisodeChange, selectedSeason]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoEnded(true);
    // In watch party, only host triggers auto-next; guest waits for broadcast
    if (controlsDisabled) return;
    const next = getNextEpisode();
    if (next) {
      setShowNextEpisode(true);
      setNextEpisodeCountdown(5);
      countdownRef.current = setInterval(() => {
        setNextEpisodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            playEpisode(next);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [getNextEpisode, playEpisode, controlsDisabled]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    }
  }, [isPlaying, isLocked]);

  const togglePlay = useCallback(() => {
    if (controlsDisabled) return;
    const v = videoRef.current;
    if (!v) return;
    if (videoEnded) {
      v.currentTime = 0;
      v.play();
      setIsPlaying(true);
      setVideoEnded(false);
    } else {
      if (v.paused) { v.play(); setIsPlaying(true); }
      else { v.pause(); setIsPlaying(false); }
    }
    if (watchPartyActive && isHost && onForceSyncPlayback) {
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) onForceSyncPlayback(!vid.paused, vid.currentTime);
      }, 50);
    }
  }, [videoEnded, controlsDisabled, watchPartyActive, isHost, onForceSyncPlayback]);

  const skip = useCallback((seconds: number) => {
    if (controlsDisabled) return;
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      if (watchPartyActive && isHost && onForceSyncPlayback) {
        onForceSyncPlayback(!videoRef.current.paused, videoRef.current.currentTime);
      }
    }
  }, [duration, controlsDisabled, watchPartyActive, isHost, onForceSyncPlayback]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  // Keyboard Shortcuts - use e.key directly (case-sensitive)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); skip(10); break;
        case "ArrowLeft": e.preventDefault(); skip(-10); break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(prev => {
            const newVol = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            setIsMuted(false);
            return newVol;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(prev => {
            const newVol = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case "f": toggleFullscreen(); break;
        case "m": setIsMuted(prev => !prev); break;
        case "n":
          { const next = getNextEpisode(); if (next) playEpisode(next); }
          break;
        case "Escape":
          if (showEpisodes) setShowEpisodes(false);
          else if (showNextEpisode) setShowNextEpisode(false);
          else onClose();
          break;
      }
      resetControlsTimer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLocked, togglePlay, skip, toggleFullscreen, getNextEpisode, playEpisode, showEpisodes, showNextEpisode, onClose, resetControlsTimer]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying, resetControlsTimer]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // Apply volume/mute to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Watch party: guest sync from host
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

  // Watch party: host periodic sync
  const syncIntervalRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (!watchPartyActive || !isHost || !onSyncPlayback) return;
    syncIntervalRef.current = setInterval(() => {
      const v = videoRef.current;
      if (v) onSyncPlayback(!v.paused, v.currentTime);
    }, 2000);
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [watchPartyActive, isHost, onSyncPlayback]);

  // Watch party: phase control
  useEffect(() => {
    if (!watchPartyActive) return;
    const v = videoRef.current;
    if (!v) return;
    if (partyPhase === "waiting" || partyPhase === "countdown") {
      v.pause();
      v.currentTime = 0;
      setIsPlaying(false);
    } else if (partyPhase === "playing") {
      v.currentTime = 0;
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [partyPhase, watchPartyActive]);

  // Watch party: guest receives episode change from host
  useEffect(() => {
    if (!watchPartyActive || isHost || !onEpisodeChangeReceived) return;
    onEpisodeChangeReceived((data) => {
      setCurrentEpisode(data.episode);
      setSelectedSeason(data.seasonNumber);
      setVideoEnded(false);
      setShowNextEpisode(false);
      lastSavedTimeRef.current = 0;
      if (countdownRef.current) clearInterval(countdownRef.current);
    });
  }, [watchPartyActive, isHost, onEpisodeChangeReceived]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const currentSeasonData = seriesDetail?.seasons.find(s => s.number === selectedSeason);

  if (!hasValidUrl) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center text-white text-center p-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Episode Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-md">The source for S{selectedSeason} E{currentEpisode.number} is currently missing.</p>
        <button onClick={onClose} className="mt-8 px-8 py-3 bg-primary rounded-full font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      <video
        ref={videoRef}
        key={currentEpisode.id}
        src={currentEpisode.video_url}
        className="w-full h-full object-contain"
        autoPlay={shouldAutoPlay}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleVideoEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onCanPlay={() => setIsBuffering(false)}
        muted={isMuted}
      />

      {/* Stylish Buffering Overlay */}
      <AnimatePresence>
        {isBuffering && !videoEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-[103] pointer-events-none"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/10" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-primary/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <span className="text-white mt-4 text-sm font-bold tracking-wider uppercase">Loading...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Layer */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[105] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TOP BAR */}
            <div className="p-3 md:p-6 bg-gradient-to-b from-black/90 to-transparent flex items-center gap-3">
              <button onClick={() => {
                if (watchPartyActive && onEndParty) {
                  const v = videoRef.current;
                  onEndParty(v?.currentTime ?? 0, v?.duration ?? 0);
                }
                onClose();
              }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-sm md:text-xl truncate">
                  {series.title} <span className="text-white/60 font-medium">— S{selectedSeason} E{currentEpisode.number}</span>
                </h2>
                <p className="text-white/60 text-xs truncate">{currentEpisode.title}</p>
              </div>
              <button onClick={() => setShowEpisodes(true)} className="p-2 hover:bg-white/10 rounded-full">
                <List className="w-5 h-5 text-white" />
              </button>
              {nextEpisode && (
                <button onClick={() => playEpisode(nextEpisode)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                  <NextIcon className="w-4 h-4" /> Next
                </button>
              )}
              <button onClick={() => setIsLocked(true)} className="p-2 hover:bg-white/10 rounded-full">
                <Unlock className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* CENTER CONTROLS */}
            <div className={`flex items-center justify-center gap-8 md:gap-12 transition-opacity ${isBuffering ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <button onClick={() => skip(-10)} className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all">
                <SkipBack className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button onClick={togglePlay} className="p-5 md:p-6 bg-primary rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                {videoEnded ? <RefreshCw className="w-8 h-8 md:w-10 md:h-10" /> : isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current" />}
              </button>
              <button onClick={() => skip(10)} className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all">
                <SkipForward className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            {/* BOTTOM BAR */}
            <div className="p-3 md:p-8 bg-gradient-to-t from-black/90 to-transparent">
              {/* Progress Slider */}
              <div className="relative h-2 w-full mb-4 md:mb-6 group">
                <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30" style={{ width: `${bufferedPercent}%` }} />
                  <div className="h-full bg-red-600 absolute top-0 left-0 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <input 
                  type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)}
                  onTouchStart={() => setIsSeeking(true)} onTouchEnd={() => setIsSeeking(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2 md:gap-4">
                  {/* Mobile play/next */}
                  <button onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded transition-colors md:hidden">
                    {videoEnded ? <RefreshCw className="w-5 h-5" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  {nextEpisode && (
                    <button onClick={() => playEpisode(nextEpisode)} className="p-1.5 hover:bg-white/10 rounded transition-colors md:hidden">
                      <NextIcon className="w-5 h-5" />
                    </button>
                  )}
                  <div className="hidden md:flex items-center gap-1">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 hover:bg-white/10 rounded">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                      type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                      onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0) setIsMuted(false); }}
                      className="w-20 accent-primary"
                    />
                  </div>
                  <span className="text-xs font-mono text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2">
                  {/* Speed / Settings */}
                  <div className="relative">
                    <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/10 rounded-lg p-2 min-w-[120px] shadow-lg">
                        <p className="text-xs text-white/50 px-2 mb-1">Speed</p>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button key={speed} onClick={() => changeSpeed(speed)}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                              playbackSpeed === speed ? "text-primary bg-primary/10" : "text-white hover:bg-white/10"
                            }`}>{speed}x</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Mobile volume */}
                  <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 hover:bg-white/10 rounded transition-colors md:hidden">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  {/* Episodes button mobile */}
                  <button onClick={() => setShowEpisodes(true)} className="p-1.5 hover:bg-white/10 rounded transition-colors md:hidden">
                    <List className="w-5 h-5" />
                  </button>
                  <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations Bottom Sheet */}
      <AnimatePresence>
        {showRecommendations && recommendedSeries.length > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[120] max-h-[70vh] bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-white font-bold text-base">More like this</h3>
              <button
                onClick={() => setShowRecommendations(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="px-5 pb-8 overflow-y-auto max-h-[50vh] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {recommendedSeries.map((rec) => (
                  <div key={rec.id} className="group text-left rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.03]">
                    <div className="relative aspect-[2/3]">
                      <img src={rec.poster_url} alt={rec.title} className="w-full h-full object-cover" />
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
                      <p className="text-white text-xs font-medium truncate">{rec.title}</p>
                      <p className="text-white/40 text-[10px]">{rec.year} • {rec.genre[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations peek button */}
      {!videoEnded && !showRecommendations && recommendedSeries.length > 0 && showControls && !isLocked && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowRecommendations(true); }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[106] flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-500/50 backdrop-blur-sm text-white/90 text-xs font-light hover:bg-gray-400/60 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          More like this
        </button>
      )}


      {isLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLocked(false); resetControlsTimer(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm"
          >
            <Lock className="w-4 h-4" /> Tap to unlock
          </button>
        </div>
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
            <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-4 space-y-3">
                <p className="text-xs text-white/50">Next Episode</p>
                <p className="text-sm font-semibold text-white truncate">
                  S{selectedSeason} E{nextEpisode.number}: {nextEpisode.title}
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                        strokeDasharray={`${(nextEpisodeCountdown / 5) * 88} 88`} strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{nextEpisodeCountdown}</span>
                  </div>
                  <span className="text-xs text-white/50">Playing in {nextEpisodeCountdown}s</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => playEpisode(nextEpisode)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-semibold text-xs transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                  </button>
                  <button onClick={() => { setShowNextEpisode(false); if (countdownRef.current) clearInterval(countdownRef.current); }}
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Episode Panel */}
      <AnimatePresence>
        {showEpisodes && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-full md:w-80 bg-zinc-900/95 backdrop-blur-md border-l border-white/10 z-[120] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Episodes</h3>
              <button onClick={() => setShowEpisodes(false)} className="p-1.5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {seriesDetail && seriesDetail.seasons.length > 1 && (
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {seriesDetail.seasons.map((s) => (
                    <button key={s.number} onClick={() => setSelectedSeason(s.number)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedSeason === s.number ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"
                      }`}>
                      Season {s.number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              {currentSeasonData?.episodes.map(ep => (
                <button
                  key={ep.id} 
                  onClick={() => playEpisode(ep)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${ep.id === currentEpisode.id ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      ep.id === currentEpisode.id ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60'
                    }`}>{ep.number}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${ep.id === currentEpisode.id ? 'text-primary' : 'text-white'}`}>
                        {ep.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{ep.duration}</p>
                      {ep.id === currentEpisode.id && (
                        <div className="flex items-center gap-1 mt-1 text-primary">
                          <Play className="w-3 h-3 fill-current" />
                          <span className="text-xs font-medium">Now Playing</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
