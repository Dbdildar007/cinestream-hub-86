import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    localStorage.setItem("cinestream-theme", "dark");
  }, []);

  return { isDark: true };
}
