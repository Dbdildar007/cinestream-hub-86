import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "expand" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("expand"), 1800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/30"
                initial={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1.5,
                  repeat: 0,
                }}
              />
            ))}
          </div>

          {/* Radial glow behind logo */}
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Logo container */}
          <div className="relative flex flex-col items-center gap-4">
            {/* F icon / spark */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.div
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(var(--primary)), hsl(0 84% 50%))",
                }}
                animate={phase === "expand" ? { scale: [1, 1.2, 40], opacity: [1, 1, 0] } : {}}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <motion.span
                  className="text-4xl md:text-5xl font-display font-black text-primary-foreground italic"
                  animate={phase === "expand" ? { opacity: 0 } : {}}
                  transition={{ duration: 0.3 }}
                >
                  F
                </motion.span>
              </motion.div>

              {/* Spark ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: "2px solid hsl(var(--primary) / 0.5)" }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </motion.div>

            {/* Brand text */}
            <motion.div
              className="flex items-center gap-0.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <motion.span
                className="text-5xl md:text-6xl font-display tracking-wider font-black bg-gradient-to-r from-orange-500 via-primary to-red-500 bg-clip-text text-transparent italic"
                animate={phase === "expand" ? { opacity: 0, y: -20 } : {}}
                transition={{ duration: 0.4 }}
              >
                Fl
              </motion.span>
              <motion.span
                className="text-5xl md:text-6xl font-display tracking-wider font-extralight text-foreground italic"
                animate={phase === "expand" ? { opacity: 0, y: -20 } : {}}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                icker
              </motion.span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-sm md:text-base text-muted-foreground tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              Stream your world
            </motion.p>

            {/* Loading bar */}
            <motion.div
              className="w-32 h-0.5 bg-secondary rounded-full overflow-hidden mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(25 95% 53%), hsl(var(--primary)), hsl(0 84% 50%))",
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
