import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? "min-h-screen" : ""}`}
    >
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </motion.div>
  );

  return spinner;
}

export function ContentSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]">
          <div className="aspect-[2/3] rounded-md bg-secondary animate-pulse" />
          <div className="mt-2 h-3 bg-secondary rounded animate-pulse w-3/4" />
          <div className="mt-1 h-2.5 bg-secondary rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] bg-gradient-to-br from-muted to-secondary overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" 
        style={{ animation: "shimmer 2s infinite" }} />
      <div className="absolute bottom-[15%] md:bottom-[20%] left-0 right-0 px-6 md:px-12">
        <div className="h-10 md:h-14 bg-muted/60 rounded-lg w-2/3 md:w-1/2 mb-4 animate-pulse" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 bg-muted/40 rounded w-12 animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-16 animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-20 animate-pulse" />
        </div>
        <div className="h-4 bg-muted/30 rounded w-3/4 md:w-2/3 mb-2 animate-pulse" />
        <div className="h-4 bg-muted/30 rounded w-1/2 md:w-1/3 mb-6 animate-pulse" />
        <div className="flex gap-3">
          <div className="h-12 w-36 bg-primary/20 rounded-lg animate-pulse" />
          <div className="h-12 w-36 bg-muted/40 rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

export function MovieRowSkeleton({ title }: { title?: string }) {
  return (
    <section className="relative px-4 md:px-12 mb-8 animate-fade-in">
      {title && (
        <div className="h-6 md:h-7 bg-muted/50 rounded w-40 mb-4 animate-pulse" />
      )}
      <div className="flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]" style={{ opacity: 1 - i * 0.08 }}>
            <div className="relative aspect-[2/3] rounded-md bg-gradient-to-b from-muted/60 to-muted/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent animate-pulse" />
            </div>
            <div className="mt-2 h-3.5 bg-muted/40 rounded animate-pulse w-3/4" />
            <div className="mt-1.5 flex items-center gap-1">
              <div className="w-3 h-3 bg-muted/30 rounded-full animate-pulse" />
              <div className="h-2.5 bg-muted/30 rounded animate-pulse w-8" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
