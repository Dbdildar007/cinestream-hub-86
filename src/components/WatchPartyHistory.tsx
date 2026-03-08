import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/services/movieService";

interface PartyHistoryItem {
  id: string;
  host_id: string;
  friend_id: string;
  movie_id: string;
  episode_id: string | null;
  media_type: string;
  current_time_sec: number;
  duration_sec: number;
  started_at: string;
  ended_at: string | null;
  friend_name?: string;
}

interface WatchPartyHistoryProps {
  onResumeMovie?: (movie: Movie, currentTime: number) => void;
  onResumeSeries?: (movie: Movie, episodeId: string, currentTime: number) => void;
}

export default function WatchPartyHistory({ onResumeMovie, onResumeSeries }: WatchPartyHistoryProps) {
  const { user } = useAuth();
  const { allMovies } = useMovies();
  const [history, setHistory] = useState<PartyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchHistory = async () => {
      const { data } = await (supabase
        .from("watch_party_history") as any)
        .select("*")
        .or(`host_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order("started_at", { ascending: false })
        .range(0, 20);

      if (data) {
        const withNames = await Promise.all(
          data.map(async (item: any) => {
            const friendUserId = item.host_id === user.id ? item.friend_id : item.host_id;
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", friendUserId)
              .single();
            return { ...item, friend_name: profile?.display_name || "Unknown" };
          })
        );
        setHistory(withNames);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const handleCardClick = (item: PartyHistoryItem, movie: Movie) => {
    if (item.media_type === 'series' && item.episode_id && onResumeSeries) {
      onResumeSeries(movie, item.episode_id, item.current_time_sec);
    } else if (onResumeMovie) {
      onResumeMovie(movie, item.current_time_sec);
    }
  };

  if (!user || loading) return null;
  if (history.length === 0) return null;

  return (
    <section className="relative px-4 md:px-12 mb-8">
      <h2 className="text-xl md:text-2xl font-display tracking-wide text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        YOU ENJOYED TOGETHER
      </h2>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          <AnimatePresence initial={false} mode="popLayout">
            {history.map((item) => {
              const movie = allMovies.find((m) => m.id === item.movie_id);
              if (!movie) return null;

              const percent = item.duration_sec > 0 ? (item.current_time_sec / item.duration_sec) * 100 : 0;
              const remainMin = item.duration_sec > 0 ? Math.ceil((item.duration_sec - item.current_time_sec) / 60) : 0;
              const watchedMin = Math.floor(item.current_time_sec / 60);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative flex-shrink-0 w-[200px] md:w-[260px] cursor-pointer group/card"
                  onClick={() => handleCardClick(item, movie)}
                >
                  <div className="relative rounded-md overflow-hidden aspect-video bg-secondary">
                    <img
                      src={movie.heroImage || movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                    {/* Series/Movie badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/90 text-primary-foreground uppercase tracking-wider">
                      {item.media_type === 'series' ? 'Series' : 'Movie'}
                    </span>

                    {/* Friend badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/70 backdrop-blur-sm">
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-medium text-foreground truncate max-w-[80px]">
                        {item.friend_name}
                      </span>
                    </div>

                    {/* Play icon center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <div className="p-3 rounded-full bg-primary/90">
                        <Play className="w-6 h-6 text-primary-foreground fill-current" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    {item.duration_sec > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                        <div className="h-full bg-primary rounded-r-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs md:text-sm font-medium text-foreground truncate">{movie.title}</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                        {movie.genre?.slice(0, 2).join(" · ")} · {formatDate(item.started_at)}
                      </p>
                    </div>
                    {item.duration_sec > 0 && (
                      <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                        {remainMin > 0 ? `${remainMin}m left` : `${watchedMin}m`}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}
