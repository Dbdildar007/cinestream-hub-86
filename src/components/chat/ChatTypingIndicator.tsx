import { motion } from "framer-motion";

export default function ChatTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay }}
              className="w-2 h-2 rounded-full bg-muted-foreground"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
