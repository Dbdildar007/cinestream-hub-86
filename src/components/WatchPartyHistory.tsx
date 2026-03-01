import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMovies } from "@/hooks/useMovies";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PartyHistoryItem {
  id: string;
  host_id: string;
  friend_id: string;
  movie_id: string;
  started_at: string;
  ended_at: string | null;
  duration_watched_sec: number;
  friend_name?: string;
}

export default function WatchPartyHistory() {
  const { user } = useAuth();
  const { allMovies } = useMovies();
  const [history, setHistory] = useState<PartyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchHistory = async () => {
      const { data } = await supabase
        .from("watch_party_history")
        .select("*")
        .or(`host_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order("started_at", { ascending: false })
        .range(0, 20);

      if (data) {
        // Fetch friend names
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

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

  if (!user || loading) {
    return loading ? <LoadingSpinner size="sm" text="Loading history..." /> : null;
  }

  if (history.length === 0) return null;

  return (
    <div className="px-4 md:px-12 mb-8">
      <h2 className="text-lg md:text-xl font-display tracking-wider text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Watch Party History
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {history.map((item) => {
          const movie = allMovies.find((m) => m.id === item.movie_id);
          if (!movie) return null;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 w-[200px] md:w-[240px] bg-card rounded-xl overflow-hidden border border-border"
            >
              <div className="relative aspect-[16/9]">
                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-semibold text-foreground truncate">{movie.title}</p>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span className="truncate">with {item.friend_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(item.duration_watched_sec)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60">{formatDate(item.started_at)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
