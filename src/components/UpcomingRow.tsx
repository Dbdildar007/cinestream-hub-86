import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, Tv, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Movie } from "@/services/movieService";

interface UpcomingRowProps {
  movies: Movie[];
  onMovieSelect: (movie: Movie) => void;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return <span className="text-primary font-semibold text-[10px]">Available Now!</span>;

  return (
    <div className="flex gap-1.5">
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-foreground leading-none">{timeLeft.days}</span>
          <span className="text-[8px] text-muted-foreground uppercase">days</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-foreground leading-none">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-[8px] text-muted-foreground uppercase">hrs</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-foreground leading-none">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-[8px] text-muted-foreground uppercase">min</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-foreground leading-none">{String(timeLeft.seconds).padStart(2, "0")}</span>
        <span className="text-[8px] text-muted-foreground uppercase">sec</span>
      </div>
    </div>
  );
}

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatUpcomingDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function UpcomingRow({ movies, onMovieSelect }: UpcomingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Fetch reminders from DB
  useEffect(() => {
    if (!user) {
      // Fall back to localStorage for non-logged-in users
      try {
        const saved = localStorage.getItem("cinestream-reminders");
        if (saved) setReminders(new Set(JSON.parse(saved)));
      } catch {}
      return;
    }

    const fetchReminders = async () => {
      const { data } = await supabase
        .from("movie_reminders")
        .select("movie_id")
        .eq("user_id", user.id)
        .eq("notified", false);
      if (data) {
        setReminders(new Set(data.map((r: any) => r.movie_id)));
      }
    };
    fetchReminders();
  }, [user]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  const toggleReminder = useCallback(async (movieId: string) => {
    if (!user) {
      toast.error("Please sign in to set reminders");
      return;
    }

    setLoading(prev => new Set(prev).add(movieId));

    const isSet = reminders.has(movieId);

    if (isSet) {
      // Remove reminder
      await supabase
        .from("movie_reminders")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);

      setReminders(prev => {
        const next = new Set(prev);
        next.delete(movieId);
        return next;
      });
      toast("Reminder removed");
    } else {
      // Add reminder
      await supabase
        .from("movie_reminders")
        .upsert({ user_id: user.id, movie_id: movieId, notified: false });

      setReminders(prev => new Set(prev).add(movieId));
      toast.success("You'll be notified when this is available!");
    }

    setLoading(prev => {
      const next = new Set(prev);
      next.delete(movieId);
      return next;
    });
  }, [user, reminders]);

  if (movies.length === 0) return null;

  return (
    <section className="relative px-4 md:px-12 mb-8 mt-6 md:mt-10">
      <h2 className="text-xl md:text-2xl font-display tracking-wide text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        COMING SOON
      </h2>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-r from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
          {movies.map((movie) => (
            <motion.div
              key={movie.id}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="relative flex-shrink-0 w-[200px] md:w-[260px] cursor-pointer group/card"
              onClick={() => onMovieSelect(movie)}
            >
              <div className="relative rounded-md overflow-hidden aspect-video bg-secondary">
                <img
                  src={movie.heroImage || movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover brightness-75"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent dark:from-background/95 dark:via-background/30" />

                {movie.isSeries && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/90 text-primary-foreground uppercase tracking-wider flex items-center gap-1">
                    <Tv className="w-2.5 h-2.5" /> Series
                  </span>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); toggleReminder(movie.id); }}
                  disabled={loading.has(movie.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 ${
                    reminders.has(movie.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/70 text-foreground hover:bg-background"
                  } ${loading.has(movie.id) ? "opacity-50" : ""}`}
                >
                  <Bell className={`w-3.5 h-3.5 ${reminders.has(movie.id) ? "fill-current" : ""}`} />
                </button>

                <div className="absolute bottom-2 left-2 right-2">
                  <CountdownTimer targetDate={movie.upcomingDate!} />
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-xs md:text-sm font-medium text-foreground truncate">{movie.title}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {formatUpcomingDate(movie.upcomingDate!)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-l from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}
