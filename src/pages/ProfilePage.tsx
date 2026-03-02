import { motion } from "framer-motion";
import { User, Settings, LogOut, ChevronRight, Heart, Clock, Star, Users, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRatings } from "@/hooks/useRatings";
import { useWatchProgress } from "@/hooks/useWatchProgress";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const { ratings } = useRatings();
  const { getContinueWatching } = useWatchProgress();

  const [profile, setProfile] = useState<{ display_name: string; unique_id: string } | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, unique_id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
        localStorage.setItem('user_profile', JSON.stringify(data));
      });
  }, [user]);

  const historyCount = getContinueWatching().length;
  const ratingsCount = Object.keys(ratings).length;

  const menuItems = [
    { icon: Heart, label: "My Watchlist", count: String(watchlist.length), action: () => navigate("/watchlist") },
    { icon: Clock, label: "Watch History", count: String(historyCount), action: () => navigate("/watch-history") },
    { icon: Star, label: "My Ratings", count: String(ratingsCount), action: () => navigate("/my-ratings") },
    { icon: Users, label: "Friends", count: null, action: () => navigate("/friends") },
    { icon: Settings, label: "Settings", count: null, action: () => navigate("/settings") },
  ];

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem('user_profile');
    toast.success("Signed out");
    navigate("/");
  };

  const copyUniqueId = () => {
    if (profile?.unique_id) {
      navigator.clipboard.writeText(profile.unique_id);
      toast.success("ID copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-24 px-4 md:px-12 pb-24"
    >
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">
            {profile?.display_name?.toUpperCase() || (user ? "USER" : "GUEST")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user ? "Premium Member" : "Sign in for full access"}
          </p>
        </div>
      </div>

      {/* Unique ID card */}
      {profile?.unique_id && (
        <button
          onClick={copyUniqueId}
          className="w-full flex items-center gap-3 p-4 rounded-lg bg-secondary mb-6 hover:bg-secondary/80 transition-colors"
        >
          <div className="flex-1 text-left">
            <p className="text-xs text-muted-foreground mb-0.5">Your Unique ID</p>
            <p className="text-sm font-mono text-primary font-semibold">{profile.unique_id}</p>
          </div>
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {!user && (
        <button
          onClick={() => navigate("/auth")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold text-sm transition-colors mb-6"
        >
          Sign In / Create Account
        </button>
      )}

      {/* Menu items */}
      <div className="space-y-2 mb-10">
        {menuItems.map(({ icon: Icon, label, count, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
            {count && count !== "0" && (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{count}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {user && (
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      )}
    </motion.div>
  );
}
