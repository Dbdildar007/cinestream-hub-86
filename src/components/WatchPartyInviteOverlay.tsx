import { motion, AnimatePresence } from "framer-motion";
import { Film, X, Check } from "lucide-react";
import { useWatchPartyContext } from "@/contexts/WatchPartyContext";

export default function WatchPartyInviteOverlay() {
  const { pendingInvite, acceptInvite, declineInvite } = useWatchPartyContext();

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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Film className="w-7 h-7 text-primary" />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-1">Watch Party Invite</h2>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-foreground font-semibold">{pendingInvite.hostName}</span> wants to watch{" "}
              <span className="text-foreground font-semibold">"{pendingInvite.movieTitle}"</span> with you
            </p>

            <div className="flex gap-3">
              <button
                onClick={declineInvite}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={acceptInvite}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
