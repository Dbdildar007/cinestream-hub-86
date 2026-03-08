import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Series } from "@/services/seriesService";
import SeriesCard from "./SeriesCard";

interface SeriesRowProps {
  title: string;
  seriesList: any[]; // Use your Series type here
  onSeriesSelect: (series: any) => void;
  // ADD THESE:
  onRate?: (id: string, rating: number) => void;
  getRating?: (id: string) => number;
  onToggleWatchlist?: (id: string) => void;
  isInWatchlist?: (id: string) => boolean;
}

export default function SeriesRow({ title, seriesList, onSeriesSelect, onRate,getRating, onToggleWatchlist, isInWatchlist }: SeriesRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (seriesList.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative px-4 md:px-12 mb-8"
    >
      <h2 className="text-xl md:text-2xl font-display tracking-wide text-foreground mb-4">
        {title.toUpperCase()}
      </h2>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
            {seriesList.map((series) => (
          <SeriesCard
            key={series.id}
            series={series}
            onSelect={() => onSeriesSelect(series)}
            // PASS THESE DOWN:
            onRate={onRate}
            userRating={getRating ? getRating(series.id) : 0}
            onToggleWatchlist={onToggleWatchlist}
            isWatchlisted={isInWatchlist ? isInWatchlist(series.id) : false}
          />
        ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-10 hidden md:flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </motion.section>
  );
}
