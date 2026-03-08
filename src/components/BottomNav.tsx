import { Home, Search, Download, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotification, sendNotification } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around bg-background/95 backdrop-blur-md border-t border-border py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;

        // Replace Profile slot with notification dropdown on mobile
        if (label === "Profile") {
          return (
            <div key={path} className="flex flex-col items-center gap-1 px-3 py-1 relative">
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllRead={markAllRead}
                onClear={clearNotification}
                onSendNotification={sendNotification}
                isMobile
              />
              <span className="text-[10px] font-medium text-muted-foreground">Alerts</span>
            </div>
          );
        }

        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors relative ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
