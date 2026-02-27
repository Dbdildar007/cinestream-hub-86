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
    <div className="relative w-full h-[70vh] md:h-[85vh] bg-secondary animate-pulse">
      <div className="absolute bottom-[15%] md:bottom-[20%] left-0 right-0 px-6 md:px-12">
        <div className="h-12 bg-muted rounded w-1/2 mb-3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 mb-6 animate-pulse" />
        <div className="flex gap-3">
          <div className="h-12 w-32 bg-muted rounded animate-pulse" />
          <div className="h-12 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
