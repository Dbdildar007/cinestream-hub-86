import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Play, Pause, Volume2, VolumeX, Maximize,
  SkipBack, SkipForward, Settings, X, Subtitles,
  RotateCcw, ChevronLeft, Lock, Unlock,
  List, ChevronDown, SkipForward as NextIcon,
  RefreshCw, AlertCircle
} from "lucide-react";
import type { Series, SeriesEpisode, SeriesSeason } from "@/services/seriesService";
import { useSeriesDetail } from "@/hooks/useSeries";

interface SeriesVideoPlayerProps {
  series: Series;
  initialEpisode: SeriesEpisode;
  initialSeason: number;
  onClose: () => void;
}

export default function SeriesVideoPlayer({
  series, initialEpisode, initialSeason, onClose,
}: SeriesVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { series: seriesDetail } = useSeriesDetail(series.id);

  const [currentEpisode, setCurrentEpisode] = useState<SeriesEpisode>(initialEpisode);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);

  const [isPlaying, setIsPlaying] = useState(true);
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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);

  // Next episode auto-play
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const hasValidUrl = !!(currentEpisode.video_url && currentEpisode.video_url.trim() !== '');

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

  const playEpisode = useCallback((episode: SeriesEpisode) => {
    setCurrentEpisode(episode);
    setShowEpisodes(false);
    setShowNextEpisode(false);
    setVideoEnded(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (seriesDetail) {
      const season = seriesDetail.seasons.find(s => s.episodes.some(e => e.id === episode.id));
      if (season) setSelectedSeason(season.number);
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 100);
    resetControlsTimer();
  }, [seriesDetail, resetControlsTimer]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoEnded(true);
    const next = getNextEpisode();
    if (next) {
      setShowNextEpisode(true);
      setNextEpisodeCountdown(5);
      countdownRef.current = setInterval(() => {
        setNextEpisodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            playEpisode(next);
            setShowNextEpisode(false);
            setVideoEnded(false);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [getNextEpisode, playEpisode]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
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
          if (showEpisodes) setShowEpisodes(false);
          else if (showNextEpisode) setShowNextEpisode(false);
          else if (isFullscreen) toggleFullscreen();
          else onClose();
          break;
      }
      resetControlsTimer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLocked, isFullscreen, volume, isPlaying, showEpisodes, showNextEpisode]);

  const togglePlay = () => {
    if (videoEnded) {
      const v = videoRef.current;
      if (v) { v.currentTime = 0; v.play(); setIsPlaying(true); setVideoEnded(false); }
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const skip = (seconds: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.currentTime + seconds, duration));
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
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
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

  const cancelNextEpisode = () => {
    setShowNextEpisode(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const currentSeasonData = seriesDetail?.seasons?.find(s => s.number === selectedSeason);

  // No valid URL - show unavailable screen
  if (!hasValidUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center text-white p-6 text-center"
      >
        <div className="bg-secondary/20 p-8 rounded-2xl border border-border backdrop-blur-md max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Episode Unavailable</p>
          <p className="text-muted-foreground mb-2 text-sm">
            S{selectedSeason} E{currentEpisode.number}: {currentEpisode.title}
          </p>
          <p className="text-muted-foreground mb-6 text-xs">
            The video for this episode of "{series.title}" is not available in our database yet.
          </p>
          
          {nextEpisode && (
            <button
              onClick={() => playEpisode(nextEpisode)}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition-transform mb-3"
            >
              <Play className="w-4 h-4 inline mr-2" />
              Play Next Episode
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-full font-bold hover:scale-105 transition-transform"
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
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
    >
      <video
        ref={videoRef}
        key={currentEpisode.video_url}
        src={currentEpisode.video_url}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) setDuration(v.duration);
        }}
        onEnded={handleVideoEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {/* Buffering */}
      <AnimatePresence>
        {isBuffering && !videoEnded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-[103] pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="text-xs text-foreground/70">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock screen */}
      {isLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110]">
          <button onClick={(e) => { e.stopPropagation(); setIsLocked(false); resetControlsTimer(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground text-sm">
            <Lock className="w-4 h-4" /> Tap to unlock
          </button>
        </div>
      )}

      {/* Next Episode Auto-play Overlay */}
      <AnimatePresence>
        {showNextEpisode && nextEpisode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 md:right-8 z-[115] w-[260px] md:w-[340px]"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border overflow-hidden shadow-2xl">
              <div className="relative aspect-video bg-secondary">
                {series.poster_url && (
                  <img src={series.poster_url} alt="Next episode" className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-muted-foreground mb-1">Next Episode</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    E{nextEpisode.number}: {nextEpisode.title}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                      <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                        strokeDasharray={`${(nextEpisodeCountdown / 5) * 88} 88`} strokeLinecap="round"
                        className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      {nextEpisodeCountdown}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Playing in {nextEpisodeCountdown}s</span>
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

      {/* Episode List Panel */}
      <AnimatePresence>
        {showEpisodes && seriesDetail && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-[320px] md:w-[380px] bg-card/95 backdrop-blur-md z-[115] overflow-y-auto border-l border-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Episodes</h3>
                <button onClick={() => setShowEpisodes(false)} className="p-1.5 rounded-full hover:bg-muted/30">
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {seriesDetail.seasons.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  {seriesDetail.seasons.map(season => (
                    <button key={season.id} onClick={() => setSelectedSeason(season.number)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        selectedSeason === season.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                      S{season.number}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {currentSeasonData?.episodes.map(ep => {
                  const isCurrent = ep.id === currentEpisode.id;
                  const epHasVideo = !!(ep.video_url && ep.video_url.trim() !== '');
                  return (
                    <button key={ep.id} onClick={() => playEpisode(ep)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isCurrent ? "bg-primary/20 border border-primary/30" : "bg-secondary/50 hover:bg-secondary"
                      }`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                          E{ep.number}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">{ep.title}</span>
                        {isCurrent && <Play className="w-3 h-3 text-primary fill-current flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{ep.duration}</p>
                      {!epHasVideo && (
                        <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Video not available
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0 z-[105]"
            onClick={(e) => e.stopPropagation()}>
            
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-3 pb-12 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-foreground font-semibold text-sm md:text-base truncate">
                    {series.title}
                    <span className="text-muted-foreground font-normal"> — S{selectedSeason} E{currentEpisode.number}</span>
                  </h2>
                  <p className="text-muted-foreground text-xs truncate">{currentEpisode.title}</p>
                </div>
                <button onClick={() => setShowEpisodes(!showEpisodes)} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <List className="w-5 h-5 text-foreground" />
                </button>
                {nextEpisode && (
                  <button onClick={() => playEpisode(nextEpisode)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 text-foreground text-xs font-medium transition-colors">
                    <NextIcon className="w-4 h-4" /> Next
                  </button>
                )}
                <button onClick={() => setIsLocked(true)} className="p-2 rounded-full hover:bg-muted/30 transition-colors">
                  <Unlock className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 md:gap-12">
              <button onClick={() => skip(-10)} className="p-3 rounded-full bg-background/30 hover:bg-background/50 transition-colors">
                <SkipBack className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </button>
              <button onClick={togglePlay} className="p-4 md:p-5 rounded-full bg-primary/90 hover:bg-primary transition-colors">
                {videoEnded ? <RefreshCw className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" /> :
                 isPlaying ? <Pause className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" /> :
                 <Play className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground fill-current" />}
              </button>
              <button onClick={() => skip(10)} className="p-3 rounded-full bg-background/30 hover:bg-background/50 transition-colors">
                <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </button>
            </div>

            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-4 px-4 md:px-6">
              <div className="relative group mb-3">
                <div className="h-1 group-hover:h-2 transition-all bg-muted/40 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-full" style={{ width: `${bufferedPercent}%` }} />
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                  onChange={handleSeek}
                  onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)}
                  onTouchStart={() => setIsSeeking(true)} onTouchEnd={() => setIsSeeking(false)}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
                  style={{ left: `calc(${progressPercent}% - 6px)` }} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <button onClick={togglePlay} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                    {videoEnded ? <RefreshCw className="w-5 h-5 text-foreground" /> :
                     isPlaying ? <Pause className="w-5 h-5 text-foreground" /> :
                     <Play className="w-5 h-5 text-foreground fill-current" />}
                  </button>
                  {nextEpisode && (
                    <button onClick={() => playEpisode(nextEpisode)} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                      <NextIcon className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                  <div className="hidden md:flex items-center gap-1 relative"
                    onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
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
                  <button onClick={() => setShowEpisodes(!showEpisodes)} className="p-1.5 hover:bg-muted/30 rounded transition-colors md:hidden">
                    <List className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="p-1.5 hover:bg-muted/30 rounded transition-colors">
                      <Settings className="w-5 h-5 text-foreground" />
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg p-2 min-w-[120px] shadow-lg">
                        <p className="text-xs text-muted-foreground px-2 mb-1">Speed</p>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <button key={speed} onClick={() => changeSpeed(speed)}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                              playbackSpeed === speed ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/30"
                            }`}>{speed}x</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={toggleFullscreen} className="p-1.5 hover:bg-muted/30 rounded transition-colors">
                    <Maximize className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
