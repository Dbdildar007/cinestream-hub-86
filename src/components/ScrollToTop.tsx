import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  // useLocation gives us the current URL (pathname)
  const { pathname } = useLocation();

  useEffect(() => {
    // Whenever the pathname changes, move the window to coordinates (0,0)
    window.scrollTo(0, 0);
  }, [pathname]); // This array ensures the code runs every time 'pathname' changes

  return null; // This component doesn't render anything visual
};

export default ScrollToTop;
