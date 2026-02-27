import { Search, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Search", path: "/search" },
  { label: "Folders", path: "/folders" },
  { label: "Friends", path: "/friends" },
  { label: "Downloads", path: "/downloads" },
];

export default function TopNav() {
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotification } = useNotifications();

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-8 py-4 bg-gradient-to-b from-background/95 to-background/0 backdrop-blur-sm"
    >
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-display tracking-wider text-primary">
          CINESTREAM
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                location.pathname === item.path ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/search" className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Search className="w-5 h-5 text-foreground" />
        </Link>
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllRead={markAllRead}
          onClear={clearNotification}
        />
        <Link to="/friends" className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Users className="w-5 h-5 text-foreground" />
        </Link>
        <Link to="/profile" className="p-2 rounded-full hover:bg-secondary transition-colors">
          <User className="w-5 h-5 text-foreground" />
        </Link>
      </div>
    </motion.header>
  );
}
