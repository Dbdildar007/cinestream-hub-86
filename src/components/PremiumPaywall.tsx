import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, X } from "lucide-react";

interface PremiumPaywallProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

export default function PremiumPaywall({ open, onClose, title }: PremiumPaywallProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border border-yellow-500/30 shadow-2xl overflow-hidden text-center"
          >
            {/* Gold gradient header */}
            <div className="relative bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-transparent px-6 pt-8 pb-4">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center">
                <Lock className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-xl font-display tracking-wider text-foreground mb-1">PREMIUM CONTENT</h2>
              <p className="text-sm text-muted-foreground">
                <span className="text-yellow-400 font-semibold">{title}</span> is exclusive to premium members
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                {["Unlimited premium movies & series", "Ad-free streaming experience", "Early access to new releases"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-left">
                    <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-sm hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20"
              >
                <Crown className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Upgrade to Premium
              </button>
              <button
                onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
