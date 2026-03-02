import { Home, Search, Download, User, Users, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around bg-background/95 backdrop-blur-md border-t border-border py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        const showBadge = label === "Profile" && unreadCount > 0;
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors relative ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            {showBadge && (
              <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
