import { motion, AnimatePresence } from "framer-motion";
import {
  User, Settings, LogOut, ChevronRight, Heart, Clock, Star, Popcorn,
  Copy, KeyRound, Eye, EyeOff, MapPin, Camera, Edit2, UserPlus, MessageCircle, Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRatings } from "@/hooks/useRatings";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useFriends } from "@/hooks/useFriends";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileMenu from "@/components/profile/ProfileMenu";
import ChangePasswordSection from "@/components/profile/ChangePasswordSection";
import FriendSuggestions from "@/components/profile/FriendSuggestions";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const { ratings } = useRatings();
  const { getContinueWatching } = useWatchProgress();
  const { friends } = useFriends();

  const [profile, setProfile] = useState<{
    display_name: string;
    unique_id: string;
    avatar_url: string | null;
    location: string;
  } | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, unique_id, avatar_url, location")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const profileData = {
            display_name: data.display_name,
            unique_id: data.unique_id,
            avatar_url: data.avatar_url,
            location: (data as any).location || "",
          };
          setProfile(profileData);
          setLocationInput(profileData.location);
          localStorage.setItem('user_profile', JSON.stringify(profileData));
        }
      });
  }, [user]);

  const historyCount = getContinueWatching().length;
  const ratingsCount = Object.keys(ratings).length;

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

  const saveLocation = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ location: locationInput } as any)
      .eq("user_id", user.id);
    setProfile(prev => prev ? { ...prev, location: locationInput } : prev);
    setEditingLocation(false);
    toast.success("Location updated!");
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background pt-20 px-4 pb-24 flex flex-col items-center justify-center gap-4"
      >
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display tracking-wider text-foreground">Sign in to continue</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Create an account to build your profile, add friends, and track your watch history.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm transition-colors"
        >
          Sign In / Sign Up
        </button>
      </motion.div>
    );
  }

  const menuItems = [
    { icon: Heart, label: "My Watchlist", count: String(watchlist.length), action: () => navigate("/watchlist") },
    { icon: Clock, label: "Watch History", count: String(historyCount), action: () => navigate("/watch-history") },
    { icon: Star, label: "My Ratings", count: String(ratingsCount), action: () => navigate("/my-ratings") },
    { icon: Users, label: "Friends", count: String(friends.length), action: () => navigate("/friends") },
    { icon: Popcorn, label: "Watch Party", count: null, action: () => navigate("/friends") },
    { icon: Settings, label: "Settings", count: null, action: () => navigate("/settings") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-6 md:pt-20 pb-28"
    >
      {/* Hero profile header */}
      <ProfileHeader
        profile={profile}
        user={user}
        editingLocation={editingLocation}
        locationInput={locationInput}
        setLocationInput={setLocationInput}
        setEditingLocation={setEditingLocation}
        saveLocation={saveLocation}
        copyUniqueId={copyUniqueId}
        onAvatarUpdated={(url) => {
          setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
          localStorage.setItem('user_profile', JSON.stringify({ ...profile, avatar_url: url }));
        }}
      />

      {/* Stats row */}
      <ProfileStats
        friendsCount={friends.length}
        watchlistCount={watchlist.length}
        ratingsCount={ratingsCount}
      />

      {/* Friend suggestions */}
      <FriendSuggestions />

      {/* Menu */}
      <div className="px-4 md:px-12 mt-6">
        <ProfileMenu menuItems={menuItems} />
      </div>

      {/* Change Password */}
      <div className="px-4 md:px-12 mt-2">
        <ChangePasswordSection user={user} />
      </div>

      {/* Sign out */}
      <div className="px-4 md:px-12 mt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl hover:bg-destructive/10 transition-colors text-destructive border border-destructive/20"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
}
