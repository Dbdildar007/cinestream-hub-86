import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Star, Clock, Calendar, Globe, Tv, AlertCircle, Plus, CheckCircle, Download, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSeriesDetail } from "@/hooks/useSeries";
import type { Series, SeriesEpisode } from "@/services/seriesService";
import LoadingSpinner from "./LoadingSpinner";

interface SeriesModalProps {
  series: Series | null;
  onClose: () => void;
  onPlayEpisode: (series: Series, episode: SeriesEpisode, seasonNumber: number) => void;
  userRating?: number;
  onRate?: (id: string, rating: number) => void;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (id: string) => void;
}

export default function SeriesModal({ series, onClose, onPlayEpisode, userRating = 0, onRate, isInWatchlist = false, onToggleWatchlist }: SeriesModalProps) {
  const isMobile = useIsMobile();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const { series: seriesDetail, loading } = useSeriesDetail(series?.id || null);

  useEffect(() => {
    setSelectedSeason(1);
  }, [series?.id]);

  if (!series) return null;

  const detail = seriesDetail;
  const currentSeasonData = detail?.seasons?.find(s => s.number === selectedSeason);

  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  const desktopVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  const variants = isMobile ? mobileVariants : desktopVariants;

  return (
    <AnimatePresence>
      {series && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed z-50 bg-card overflow-y-auto ${
              isMobile
                ? "inset-x-0 bottom-0 top-[10%] rounded-t-2xl"
                : "top-0 right-0 bottom-0 w-[480px] border-l border-border"
            }`}
          >
            {/* Header image */}
            <div className="relative h-64 md:h-72">
              {series.banner_url || series.poster_url ? (
                <img src={series.banner_url || series.poster_url} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Tv className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/60 hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 px-2.5 py-1 rounded-full">
                <Tv className="w-3.5 h-3.5 text-primary-foreground" />
                <span className="text-xs font-semibold text-primary-foreground">Series</span>
              </div>
            </div>

            <div className="px-6 pb-8 -mt-16 relative">
              <h2 className="text-3xl font-display tracking-wider text-foreground mb-2">
                {series.title.toUpperCase()}
              </h2>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  {series.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {series.release_year}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {series.genre?.join(", ") || "Drama"}
                </span>
                {detail && (
                  <span className="text-primary font-medium">
                    {detail.seasons.length} Season{detail.seasons.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {series.genre?.map((g) => (
                  <span key={g} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-foreground/80 text-sm leading-relaxed mb-6">{series.description}</p>

              {/* Star rating - matches MovieModal */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">Your Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onRate?.(series.id, star)}>
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= userRating ? "text-cine-gold fill-cine-gold" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons - matches MovieModal layout */}
              <div className="flex flex-wrap gap-2 mb-4">
                {detail && detail.seasons.length > 0 && detail.seasons[0].episodes.length > 0 && (
                  <button
                    onClick={() => onPlayEpisode(series, detail.seasons[0].episodes[0], 1)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-semibold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play S1 E1
                  </button>
                )}

                <button
                  onClick={() => onToggleWatchlist?.(series.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${
                    isInWatchlist
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                >
                  {isInWatchlist ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isInWatchlist ? "Listed" : "My List"}
                </button>

              
              </div>

              {loading && <LoadingSpinner size="sm" text="Loading episodes..." />}

              {/* Season/Episode selector */}
              {detail && detail.seasons.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-lg font-display tracking-wide text-foreground mb-3">EPISODES</h3>
                  
                  {detail.seasons.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                      {detail.seasons.map((season) => (
                        <button
                          key={season.id}
                          onClick={() => setSelectedSeason(season.number)}
                          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            selectedSeason === season.number
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "bg-secondary text-secondary-foreground hover:bg-accent"
                          }`}
                        >
                          Season {season.number}
                          <span className="ml-1.5 text-xs opacity-70">
                            ({season.episodes.length} ep)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Episode list */}
                  <div className="space-y-2">
                    {currentSeasonData?.episodes.map((episode) => {
                      const hasVideo = !!(episode.video_url && episode.video_url.trim() !== '');
                      return (
                        <button
                          key={episode.id}
                          onClick={() => onPlayEpisode(series, episode, selectedSeason)}
                          className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0 w-28 h-16 rounded-md overflow-hidden bg-muted">
                              {episode.thumbnail_url ? (
                                <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" />
                              ) : series.poster_url ? (
                                <img src={series.poster_url} alt={episode.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Tv className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
                                {hasVideo ? (
                                  <Play className="w-6 h-6 text-primary-foreground fill-current" />
                                ) : (
                                  <AlertCircle className="w-6 h-6 text-destructive" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-primary">E{episode.number}</span>
                                <h4 className="text-sm font-medium text-foreground truncate">{episode.title}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{episode.duration}</p>
                              <p className="text-xs text-muted-foreground/80 line-clamp-2">{episode.description}</p>
                              {!hasVideo && (
                                <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Video not available
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {detail && detail.seasons.length === 0 && !loading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No episodes available yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
