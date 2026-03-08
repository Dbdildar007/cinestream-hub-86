import { motion, AnimatePresence } from "framer-motion";
import { Film, X, Check, Clock, EyeOff } from "lucide-react";
import { useWatchPartyContext } from "@/contexts/WatchPartyContext";

export default function WatchPartyInviteOverlay() {
  const { pendingInvite, inviteTimeRemaining, acceptInvite, declineInvite, ignoreInvite } = useWatchPartyContext();

  const progressPercent = (inviteTimeRemaining / 30) * 100;

  return (
    <AnimatePresence>
      {pendingInvite && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Countdown progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>

            {/* Timer badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-secondary rounded-full px-2 py-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={`text-xs font-mono font-bold ${inviteTimeRemaining <= 10 ? "text-destructive" : "text-foreground"}`}>
                {inviteTimeRemaining}s
              </span>
            </div>

            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 mt-1">
              <Film className="w-7 h-7 text-primary" />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-1">Watch Party Invite</h2>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-foreground font-semibold">{pendingInvite.hostName}</span> wants to watch{" "}
              <span className="text-foreground font-semibold">"{pendingInvite.movieTitle}"</span> with you
            </p>

            {/* Expiry warning */}
            {inviteTimeRemaining <= 10 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-destructive mb-3 font-medium"
              >
                Invite expires in {inviteTimeRemaining}s
              </motion.p>
            )}

            {/* Primary actions */}
            <div className="flex gap-2.5 mb-2.5">
              <button
                onClick={declineInvite}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={acceptInvite}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Check className="w-4 h-4" />
                Join
              </button>
            </div>

            {/* Ignore button */}
            <button
              onClick={ignoreInvite}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-xs font-medium"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ignore
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
