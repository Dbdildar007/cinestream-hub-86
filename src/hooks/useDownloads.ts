import { useState, useCallback } from "react";

interface DownloadState {
  movieId: string;
  progress: number;
  status: "downloading" | "complete";
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadState[]>(() => {
    const saved = localStorage.getItem("cinestream-downloads");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeDownloads, setActiveDownloads] = useState<Set<string>>(new Set());

  const startDownload = useCallback((movieId: string) => {
    if (activeDownloads.has(movieId) || downloads.some(d => d.movieId === movieId && d.status === "complete")) return;

    setActiveDownloads(prev => new Set(prev).add(movieId));
    setDownloads(prev => [...prev.filter(d => d.movieId !== movieId), { movieId, progress: 0, status: "downloading" }]);

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloads(prev => {
          const updated = prev.map(d => d.movieId === movieId ? { ...d, progress: 100, status: "complete" as const } : d);
          localStorage.setItem("cinestream-downloads", JSON.stringify(updated));
          return updated;
        });
        setActiveDownloads(prev => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
      } else {
        setDownloads(prev => prev.map(d => d.movieId === movieId ? { ...d, progress } : d));
      }
    }, 300);
  }, [activeDownloads, downloads]);

  const removeDownload = useCallback((movieId: string) => {
    setDownloads(prev => {
      const updated = prev.filter(d => d.movieId !== movieId);
      localStorage.setItem("cinestream-downloads", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getDownloadState = useCallback((movieId: string) => {
    return downloads.find(d => d.movieId === movieId);
  }, [downloads]);

  return { downloads, startDownload, removeDownload, getDownloadState };
}
