import { Home, Search, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotification, sendNotification } = useNotifications();

  // Hide bottom nav on chat screens
  if (location.pathname.startsWith("/chat/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around bg-background/95 backdrop-blur-md border-t border-border py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors relative min-w-[48px] min-h-[48px] justify-center active:scale-95 ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] ${active ? "font-bold text-foreground" : "font-medium"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
