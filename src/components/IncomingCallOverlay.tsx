import { motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallOverlayProps {
  callerName: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallOverlay({ callerName, onAccept, onDecline }: IncomingCallOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl"
      >
        {/* Avatar */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-3xl font-bold text-primary">
            {callerName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </motion.div>

        <h3 className="text-xl font-display tracking-wider text-foreground mb-1">
          {callerName || "Someone"}
        </h3>
        <p className="text-sm text-muted-foreground mb-8">is calling you...</p>

        {/* Pulsing ring animation */}
        <div className="flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <PhoneOff className="w-7 h-7" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.4)", "0 0 0 15px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-7 h-7" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
