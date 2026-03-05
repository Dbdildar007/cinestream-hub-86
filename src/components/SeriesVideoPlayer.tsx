import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Play, Pause, Volume2, VolumeX, Maximize, 
  SkipBack, SkipForward, Settings, X, ChevronLeft, 
  Lock, Unlock, List, SkipForward as NextIcon, 
  RefreshCw, AlertCircle 
} from "lucide-react";
import type { Series, SeriesEpisode } from "@/services/seriesService";
import { useSeriesDetail } from "@/hooks/useSeries";
import { useWatchProgress } from '@/hooks/useWatchProgress'; 

interface SeriesVideoPlayerProps {
  series: Series;
  initialEpisode: SeriesEpisode;
  initialSeason: number;
  onClose: () => void;
}

export default function SeriesVideoPlayer({
  series, initialEpisode, initialSeason, onClose,
}: SeriesVideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const lastSavedTimeRef = useRef<number>(0); // Prevents DB spam

  // Data Hooks
  const { series: seriesDetail } = useSeriesDetail(series.id);
  const { updateProgress } = useWatchProgress();

  // State
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
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(5);

  const hasValidUrl = !!(currentEpisode.video_url && currentEpisode.video_url.trim() !== '');

  // --- LOGIC: PROGRESS TRACKING & SYNC ---

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || isSeeking) return;

    const currentSecs = v.currentTime;
    const totalSecs = v.duration;

    // Update UI
    setCurrentTime(currentSecs);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }

    // Database Throttle: Save every 5 seconds or if video ends
    if (
      series?.id &&
      currentEpisode?.id &&
      totalSecs > 0 &&
      (Math.abs(currentSecs - lastSavedTimeRef.current) > 5 || v.ended)
    ) {
      lastSavedTimeRef.current = currentSecs;
      updateProgress(series.id, currentSecs, totalSecs, 'series', currentEpisode.id);
    }
  }, [series?.id, currentEpisode?.id, isSeeking, updateProgress]);

  // Initial Resume Logic: Start where the user left off
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    
    // Resume logic is handled by parent passing initialTime or via useWatchProgress
  };

  // --- LOGIC: EPISODE NAVIGATION ---

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
    setCurrentEpisode(episode);
    setShowEpisodes(false);
    setShowNextEpisode(false);
    setVideoEnded(false);
    lastSavedTimeRef.current = 0; // Reset throttle for new episode
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    if (seriesDetail) {
      const season = seriesDetail.seasons.find(s => s.episodes.some(e => e.id === episode.id));
      if (season) setSelectedSeason(season.number);
    }
  }, [seriesDetail]);

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
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [getNextEpisode, playEpisode]);

  // --- LOGIC: UI CONTROLS ---

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    }
  }, [isPlaying, isLocked]);

  const togglePlay = () => {
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
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "arrowright": e.preventDefault(); skip(10); break;
        case "arrowleft": e.preventDefault(); skip(-10); break;
        case "arrowup": 
          e.preventDefault(); 
          setVolume(prev => {
            const newVol = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case "arrowdown": 
          e.preventDefault(); 
          setVolume(prev => {
            const newVol = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case "f": toggleFullscreen(); break;
        case "m": setIsMuted(prev => !prev); break;
        case "escape":
          if (showEpisodes) setShowEpisodes(false);
          else if (showNextEpisode) setShowNextEpisode(false);
          else onClose();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLocked, isFullscreen, isPlaying, showEpisodes, showNextEpisode]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

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
    >
      <video
        ref={videoRef}
        key={currentEpisode.id}
        src={currentEpisode.video_url}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleVideoEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        muted={isMuted}
      />

      {/* Buffering Overlay */}
      <AnimatePresence>
        {isBuffering && !videoEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[103] bg-black/20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <span className="text-white/70 mt-4 text-sm font-medium">Buffering...</span>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Controls Layer */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[105] flex flex-col justify-between"
          >
            {/* TOP BAR */}
            <div className="p-4 md:p-6 bg-gradient-to-b from-black/90 to-transparent flex items-center gap-4">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>
              <div className="flex-1">
                <h2 className="text-white font-bold md:text-xl truncate">
                  {series.title} <span className="text-white/60 font-medium">— S{selectedSeason} E{currentEpisode.number}</span>
                </h2>
                <p className="text-white/60 text-sm truncate">{currentEpisode.title}</p>
              </div>
              <button onClick={() => setShowEpisodes(true)} className="p-2 hover:bg-white/10 rounded-full">
                <List className="w-6 h-6 text-white" />
              </button>
              <button onClick={() => setIsLocked(true)} className="p-2 hover:bg-white/10 rounded-full">
                <Unlock className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* CENTER CONTROLS */}
            <div className="flex items-center justify-center gap-12">
              <button onClick={() => skip(-10)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all">
                <SkipBack className="w-8 h-8" />
              </button>
              <button onClick={togglePlay} className="p-6 bg-primary rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                {videoEnded ? <RefreshCw className="w-10 h-10" /> : isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 fill-current" />}
              </button>
              <button onClick={() => skip(10)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all">
                <SkipForward className="w-8 h-8" />
              </button>
            </div>

            {/* BOTTOM BAR */}
            <div className="p-4 md:p-8 bg-gradient-to-t from-black/90 to-transparent">
            {/* Progress Slider */}
              <div className="relative h-2 w-full mb-6 group">
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
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 group">
                    <button onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                    <input 
                      type="range" min={0} max={1} step={0.05} value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 accent-primary"
                    />
                  </div>
                  <span className="text-sm font-mono">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')} / {Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-sm font-bold bg-white/10 px-3 py-1 rounded">{playbackSpeed}x</button>
                  <button onClick={toggleFullscreen}><Maximize /></button>
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
            className="absolute top-0 right-0 bottom-0 w-80 bg-zinc-900 border-l border-white/10 z-[120] p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-xl">Episodes</h3>
              <X className="text-white cursor-pointer" onClick={() => setShowEpisodes(false)} />
            </div>
            {seriesDetail?.seasons.find(s => s.number === selectedSeason)?.episodes.map(ep => (
              <div 
                key={ep.id} 
                onClick={() => playEpisode(ep)}
                className={`p-4 rounded-lg mb-2 cursor-pointer transition-colors ${ep.id === currentEpisode.id ? 'bg-primary' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <p className="text-white font-medium text-sm">E{ep.number}: {ep.title}</p>
                <p className="text-white/50 text-xs mt-1">{ep.duration}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
