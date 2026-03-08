import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import type { PartyPhase } from "@/hooks/useWatchParty";

interface WatchPartyCountdownProps {
  phase: PartyPhase;
  isHost: boolean;
  friendName?: string;
  movieTitle?: string;
}

export default function WatchPartyCountdown({ phase, isHost, friendName, movieTitle }: WatchPartyCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (phase !== "countdown") {
      setCount(3);
      return;
    }
    setCount(3);
    const t1 = setTimeout(() => setCount(2), 1000);
    const t2 = setTimeout(() => setCount(1), 2000);
    const t3 = setTimeout(() => setCount(0), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  if (phase === "playing" || phase === "ended") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
    >
      <AnimatePresence mode="wait">
        {phase === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-5 text-center px-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                {isHost ? "Waiting for your friend..." : "Joining watch party..."}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isHost
                  ? `Waiting for ${friendName || "your friend"} to join. Playback will start together.`
                  : `Setting up synchronized playback for "${movieTitle || "the movie"}".`}
              </p>
            </div>
            <Loader2 className="w-6 h-6 text-primary animate-spin mt-2" />
          </motion.div>
        )}

        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase">
              Starting in
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={count}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-8xl md:text-9xl font-black text-primary"
              >
                {count === 0 ? "▶" : count}
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground mt-2">
              Watching with <span className="text-foreground font-semibold">{friendName || "friend"}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
