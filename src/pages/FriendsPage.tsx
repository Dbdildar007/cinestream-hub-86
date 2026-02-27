import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserCheck, Users, Circle, X, Send, Film, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  unique_id: string;
  is_online: boolean;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  profile?: Profile;
}

interface FriendsPageProps {
  onStartCall?: (remoteUserId: string, remoteDisplayName: string) => void;
}

export default function FriendsPage({ onStartCall }: FriendsPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadFriends();
    loadPendingRequests();

    supabase
      .from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("user_id", user.id)
      .then();

    const channel = supabase
      .channel("friendships-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        loadFriends();
        loadPendingRequests();
      })
      .subscribe();

    return () => {
      supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("user_id", user.id)
        .then();
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (data) {
      const friendsWithProfiles = await Promise.all(
        data.map(async (f) => {
          const friendUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", friendUserId)
            .single();
          return { ...f, profile: profile || undefined };
        })
      );
      setFriends(friendsWithProfiles);
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (data) {
      const requestsWithProfiles = await Promise.all(
        data.map(async (f) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", f.requester_id)
            .single();
          return { ...f, profile: profile || undefined };
        })
      );
      setPendingRequests(requestsWithProfiles);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`unique_id.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq("user_id", user.id)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendFriendRequest = async (profile: Profile) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.user_id,
    });
    if (error) {
      toast.error("Could not send request. Maybe already sent?");
    } else {
      // Get current user's name
      const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      await sendNotification(
        profile.user_id,
        "friend_request",
        "Friend Request",
        `${myProfile?.display_name || "Someone"} sent you a friend request`
      );
      toast.success("Friend request sent!");
    }
  };

  const acceptRequest = async (friendshipId: string, requesterProfile?: Profile) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (!error) {
      if (requesterProfile && user) {
        const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
        await sendNotification(
          requesterProfile.user_id,
          "friend_request",
          "Request Accepted",
          `${myProfile?.display_name || "Someone"} accepted your friend request`
        );
      }
      toast.success("Friend request accepted!");
      loadFriends();
      loadPendingRequests();
    }
  };

  const declineRequest = async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) loadPendingRequests();
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background pt-20 md:pt-24 px-4 md:px-12 pb-24 flex flex-col items-center justify-center gap-4"
      >
        <Users className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-display tracking-wider text-foreground">Sign in to connect</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Create an account to add friends, start watch parties, and enjoy movies together.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-semibold text-sm transition-colors"
        >
          Sign In / Sign Up
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 md:pt-24">
        <LoadingSpinner fullScreen text="Loading friends..." />
      </div>
    );
  }

  const tabs = [
    { id: "friends" as const, label: "Friends", count: friends.length },
    { id: "requests" as const, label: "Requests", count: pendingRequests.length },
    { id: "search" as const, label: "Find Friends", count: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-20 md:pt-24 px-4 md:px-12 pb-24"
    >
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-foreground mb-6">FRIENDS</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-cine-surface-hover"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded-full text-[10px]">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Search by User ID or name..."
                className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={searchUsers}
              disabled={searching}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-2">
            {searching && <LoadingSpinner size="sm" text="Searching..." />}
            {!searching && searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.unique_id}</p>
                </div>
                <button
                  onClick={() => sendFriendRequest(profile)}
                  className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            )}
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No friends yet. Start by searching for users!</p>
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-cine-surface-hover transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {f.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${
                      f.profile?.is_online ? "text-primary fill-primary" : "text-muted-foreground fill-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.profile?.is_online ? "Online" : "Offline"}
                  </p>
                </div>
                {/* Call button - only for online friends */}
                {f.profile?.is_online && onStartCall && (
                  <button
                    onClick={() => onStartCall(f.profile!.user_id, f.profile!.display_name)}
                    className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                    title="Video Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                  title="Watch Together"
                >
                  <Film className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-2">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending requests</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {req.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{req.profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">{req.profile?.unique_id}</p>
                </div>
                <button
                  onClick={() => acceptRequest(req.id, req.profile)}
                  className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => declineRequest(req.id)}
                  className="p-2 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
