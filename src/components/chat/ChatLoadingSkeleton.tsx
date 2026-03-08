import { motion } from "framer-motion";

export default function ChatLoadingSkeleton() {
  const skeletonBubbles = [
    { isMine: false, width: "w-[55%]" },
    { isMine: true, width: "w-[45%]" },
    { isMine: false, width: "w-[65%]" },
    { isMine: false, width: "w-[40%]" },
    { isMine: true, width: "w-[50%]" },
    { isMine: true, width: "w-[35%]" },
    { isMine: false, width: "w-[60%]" },
  ];

  return (
    <div className="space-y-3 py-4">
      {skeletonBubbles.map((bubble, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className={`flex ${bubble.isMine ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${bubble.width} h-10 rounded-2xl animate-pulse ${
              bubble.isMine
                ? "bg-primary/20 rounded-br-sm"
                : "bg-secondary rounded-bl-sm"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}
