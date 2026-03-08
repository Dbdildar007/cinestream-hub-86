import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Star, Clock, Calendar, Globe, Bell, BellOff, Tv, Film, Timer } from "lucide-react";
import type { Movie } from "@/services/movieService";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UpcomingModalProps {
  movie: Movie | null;
  onClose: () => void;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return <span className="text-primary font-bold text-lg">Available Now!</span>;

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center bg-secondary/80 rounded-lg px-3 py-2 min-w-[52px]">
          <span className="text-xl font-bold text-foreground leading-none">{String(value).padStart(2, "0")}</span>
          <span className="text-[9px] text-muted-foreground uppercase mt-1 tracking-wider">{label}</span>
        </div>
      ))}
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
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function UpcomingModal({ movie, onClose }: UpcomingModalProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [reminderSet, setReminderSet] = useState(false);
  const [loadingReminder, setLoadingReminder] = useState(false);

  // Check if reminder exists
  useEffect(() => {
    if (!movie || !user) { setReminderSet(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("movie_reminders")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movie.id)
        .eq("notified", false);
      setReminderSet(!!(data && data.length > 0));
    };
    check();
  }, [movie, user]);

  const toggleReminder = useCallback(async () => {
    if (!movie) return;
    if (!user) { toast.error("Please sign in to set reminders"); return; }
    setLoadingReminder(true);

    if (reminderSet) {
      await supabase.from("movie_reminders").delete().eq("user_id", user.id).eq("movie_id", movie.id);
      setReminderSet(false);
      toast("Reminder removed");
    } else {
      await supabase.from("movie_reminders").upsert({ user_id: user.id, movie_id: movie.id, notified: false });
      setReminderSet(true);
      toast.success("You'll be notified when this is available!");
    }
    setLoadingReminder(false);
  }, [movie, user, reminderSet]);

  if (!movie) return null;

  const mobileVariants = { hidden: { y: "100%" }, visible: { y: 0 }, exit: { y: "100%" } };
  const desktopVariants = { hidden: { x: "100%" }, visible: { x: 0 }, exit: { x: "100%" } };
  const variants = isMobile ? mobileVariants : desktopVariants;

  const hasTrailer = !!(movie.url && movie.url.trim() !== "");

  return (
    <AnimatePresence>
      {movie && (
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
            {/* Hero image */}
            <div className="relative aspect-[4/3] md:aspect-video">
              <img
                src={movie.heroImage || movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/60 hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              {/* Type badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-accent/90 px-2.5 py-1 rounded-full">
                {movie.isSeries ? (
                  <><Tv className="w-3.5 h-3.5 text-accent-foreground" /><span className="text-xs font-semibold text-accent-foreground">Upcoming Series</span></>
                ) : (
                  <><Film className="w-3.5 h-3.5 text-accent-foreground" /><span className="text-xs font-semibold text-accent-foreground">Upcoming Movie</span></>
                )}
              </div>

              {/* Countdown overlay at bottom */}
              {movie.upcomingDate && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <CountdownTimer targetDate={movie.upcomingDate} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 pb-8 mt-2 relative">
              <h2 className="text-3xl font-display tracking-wider text-foreground mb-2">
                {movie.title.toUpperCase()}
              </h2>

              {/* Meta info */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  {movie.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {movie.language}
                </span>
              </div>

              {/* Genres */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {movie.genre.map((g) => (
                  <span key={g} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-foreground/80 text-sm leading-relaxed mb-6">{movie.description}</p>

              {/* Release date */}
              {movie.upcomingDate && (
                <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-secondary/50 border border-border">
                  <Timer className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Release Date</p>
                    <p className="text-sm font-medium text-foreground">{formatUpcomingDate(movie.upcomingDate)}</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {/* Play Trailer */}
                <button
                  disabled={!hasTrailer}
                  className={`flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm transition-colors ${
                    hasTrailer
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {hasTrailer ? "Play Trailer" : "Trailer Coming Soon"}
                </button>

                {/* Remind Me */}
                <button
                  onClick={toggleReminder}
                  disabled={loadingReminder}
                  className={`flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm transition-colors border ${
                    reminderSet
                      ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                  } ${loadingReminder ? "opacity-50" : ""}`}
                >
                  {reminderSet ? (
                    <><BellOff className="w-4 h-4" /> Reminder Set — Tap to Remove</>
                  ) : (
                    <><Bell className="w-4 h-4" /> Remind Me</>
                  )}
                </button>
              </div>

              {/* Categories */}
              {movie.category && movie.category.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground mb-2">Categories</p>
                  <div className="flex gap-2 flex-wrap">
                    {movie.category.map((c) => (
                      <span key={c} className="px-2.5 py-1 text-[10px] rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
