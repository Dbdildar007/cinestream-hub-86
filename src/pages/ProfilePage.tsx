import { motion } from "framer-motion";
import { User, Settings, LogOut, ChevronRight, Heart, Clock, Star } from "lucide-react";

export default function ProfilePage() {
  const menuItems = [
    { icon: Heart, label: "My Watchlist", count: "12" },
    { icon: Clock, label: "Watch History", count: "48" },
    { icon: Star, label: "My Ratings", count: "23" },
    { icon: Settings, label: "Settings", count: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-20 md:pt-24 px-4 md:px-12 pb-24"
    >
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">CINEPHILE</h1>
          <p className="text-sm text-muted-foreground">Premium Member</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2 mb-10">
        {menuItems.map(({ icon: Icon, label, count }) => (
          <button
            key={label}
            className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-cine-surface-hover transition-colors"
          >
            <Icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
            {count && (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{count}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-destructive/10 transition-colors text-destructive">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </motion.div>
  );
}
