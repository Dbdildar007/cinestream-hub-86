import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, UserCheck, Users, Circle, X, Send, Film, Phone, Loader2, CheckCircle, MessageCircle, Tv, LayoutGrid, List } from "lucide-react";
import { getAvatarUrl } from "@/utils/avatarUrl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useFriends } from "@/hooks/useFriends";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMovies } from "@/hooks/useMovies";
import { useAllSeries } from "@/hooks/useSeries";
import type { Movie } from "@/services/movieService";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  unique_id: string;
  is_online: boolean;
  avatar_url: string | null;
  location?: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  profile?: Profile;
}

// Track relationship status for search results
type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

interface FriendsPageProps {
  onStartCall?: (remoteUserId: string, remoteDisplayName: string) => void;
  onStartWatchParty?: (friendId: string, movieId: string) => void;
}

export default function FriendsPage({ onStartCall, onStartWatchParty }: FriendsPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendNotification } = useNotifications();
  const { allMovies } = useMovies();
  const { allSeries } = useAllSeries();
  const { friends, pendingRequests, sentRequests, loading, invalidate } = useFriends();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [searching, setSearching] = useState(false);
  // Track relationship status per user_id in search
  const [relationshipMap, setRelationshipMap] = useState<Record<string, RelationshipStatus>>({});
  const [defaultSuggestions, setDefaultSuggestions] = useState<Profile[]>([]);
  const [sentStaticRequests, setSentStaticRequests] = useState<Profile[]>([]);

  // Watch party invite state
  const [invitingFriend, setInvitingFriend] = useState<Friendship | null>(null);
  const [movieSearch, setMovieSearch] = useState("");
  const [modalTab, setModalTab] = useState<"movies" | "series">("movies");
  const [modalView, setModalView] = useState<"list" | "grid">("list");
  const [declineTarget, setDeclineTarget] = useState<{ id: string; profile?: Profile } | null>(null);

  const filteredMovies = movieSearch
    ? allMovies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase())).slice(0, 10)
    : allMovies.slice(0, 10);

  const filteredSeries = movieSearch
    ? allSeries.filter(s => s.title.toLowerCase().includes(movieSearch.toLowerCase())).slice(0, 10)
    : allSeries.slice(0, 10);

  // Build relationship map for search results
  const buildRelationshipMap = useCallback(async (profiles: Profile[]) => {
    if (!user || profiles.length === 0) return;
    const userIds = profiles.map(p => p.user_id);
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const map: Record<string, RelationshipStatus> = {};
    userIds.forEach(uid => { map[uid] = "none"; });

    if (data) {
      data.forEach(f => {
        const otherUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        if (userIds.includes(otherUserId)) {
          if (f.status === "accepted") {
            map[otherUserId] = "accepted";
          } else if (f.status === "pending") {
            map[otherUserId] = f.requester_id === user.id ? "pending_sent" : "pending_received";
          }
        }
      });
    }
    setRelationshipMap(map);
  }, [user]);

  // Static fallback suggestions when no real profiles available
  const STATIC_SUGGESTIONS: Profile[] = [
    { id: "static-1", user_id: "static-1", display_name: "Alex Morgan", unique_id: "CS-alex2024", is_online: true, avatar_url: null, location: "New York, USA" },
    { id: "static-2", user_id: "static-2", display_name: "Priya Sharma", unique_id: "CS-priya007", is_online: false, avatar_url: null, location: "Mumbai, India" },
    { id: "static-3", user_id: "static-3", display_name: "James Wilson", unique_id: "CS-james99", is_online: true, avatar_url: null, location: "London, UK" },
    { id: "static-4", user_id: "static-4", display_name: "Sara Khan", unique_id: "CS-sara456", is_online: false, avatar_url: null, location: "Dubai, UAE" },
    { id: "static-5", user_id: "static-5", display_name: "Mike Chen", unique_id: "CS-mike321", is_online: true, avatar_url: null, location: "Tokyo, Japan" },
    { id: "static-6", user_id: "static-6", display_name: "Emma Davis", unique_id: "CS-emma88", is_online: false, avatar_url: null, location: "Sydney, Australia" },
  ];

  // Load default suggestions for Find Friends
  useEffect(() => {
    if (!user) return;
    const loadSuggestions = async () => {
      // Get current user's location
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("location")
        .eq("user_id", user.id)
        .single();

      // Get all friendship user IDs (connected or pending)
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const connectedIds = new Set<string>();
      (friendships || []).forEach(f => {
        connectedIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
      });

      // Try location-based suggestions first
      let profiles: Profile[] = [];
      const myLocation = myProfile?.location?.trim();

      if (myLocation) {
        const { data: locationProfiles } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user.id)
          .ilike("location", `%${myLocation}%`)
          .limit(30);
        profiles = (locationProfiles || []).filter(p => !connectedIds.has(p.user_id));
      }

      // If not enough location matches, fetch all profiles
      if (profiles.length < 6) {
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user.id)
          .limit(30);
        const existingIds = new Set(profiles.map(p => p.user_id));
        const additional = (allProfiles || []).filter(
          p => !connectedIds.has(p.user_id) && !existingIds.has(p.user_id)
        );
        profiles = [...profiles, ...additional];
      }

      // If still no real profiles, use static data
      if (profiles.length === 0) {
        setDefaultSuggestions(STATIC_SUGGESTIONS);
      } else {
        setDefaultSuggestions(profiles);
      }
    };
    loadSuggestions();
  }, [user, friends, sentRequests]);

  // Update search relationship map when friendships change via useFriends realtime
  useEffect(() => {
    if (searchResults.length > 0) {
      buildRelationshipMap(searchResults);
    }
  }, [friends, pendingRequests, sentRequests, searchResults, buildRelationshipMap]);

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`unique_id.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq("user_id", user.id)
      .limit(10);
    const results = data || [];
    setSearchResults(results);
    await buildRelationshipMap(results);
    setSearching(false);
  };

  const sendFriendRequest = async (profile: Profile) => {
    if (!user) return;
    // Handle static suggestions (demo profiles)
    if (profile.user_id.startsWith("static-")) {
      setSentStaticRequests((prev) =>
        prev.some((p) => p.user_id === profile.user_id) ? prev : [profile, ...prev]
      );
      setDefaultSuggestions((prev) => prev.filter((p) => p.user_id !== profile.user_id));
      toast.success("Friend request sent!");
      return;
    }
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.user_id,
    });
    if (error) {
      toast.error("Could not send request. Maybe already sent?");
    } else {
      // Update local relationship map immediately
      setRelationshipMap(prev => ({ ...prev, [profile.user_id]: "pending_sent" }));
      // Remove from default suggestions
      setDefaultSuggestions(prev => prev.filter(p => p.user_id !== profile.user_id));
      // Invalidate queries so Requests tab updates immediately
      invalidate();
      const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      await sendNotification(
        profile.user_id,
        "friend_request",
        "Friend Request",
        `${myProfile?.display_name || "Someone"} sent you a friend request`,
        { requester_id: user.id }
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
          "Request Accepted ✅",
          `${myProfile?.display_name || "Someone"} accepted your friend request`
        );
      }
      toast.success("Friend request accepted!");
      invalidate();
    }
  };

  const declineRequest = async (friendshipId: string, requesterProfile?: Profile) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) {
      if (requesterProfile && user) {
        const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
        await sendNotification(
          requesterProfile.user_id,
          "friend_request",
          "Request Declined",
          `${myProfile?.display_name || "Someone"} declined your friend request`
        );
      }
      invalidate();
    }
  };

  const cancelSentRequest = async (friendshipId: string, profile?: Profile) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) {
      toast.success("Request cancelled");
      if (profile) {
        setDefaultSuggestions((prev) =>
          prev.some((p) => p.user_id === profile.user_id) ? prev : [profile, ...prev]
        );
      }
      invalidate();
    } else {
      toast.error("Failed to cancel request");
    }
  };

  const cancelStaticSentRequest = (profile: Profile) => {
    setSentStaticRequests((prev) => prev.filter((p) => p.user_id !== profile.user_id));
    setDefaultSuggestions((prev) =>
      prev.some((p) => p.user_id === profile.user_id) ? prev : [profile, ...prev]
    );
    toast.success("Request cancelled");
  };

  const handleInviteToWatchParty = async (movie: Movie) => {
    if (!user || !invitingFriend?.profile) return;
    const friendUserId = invitingFriend.profile.user_id;

    const { data, error } = await supabase.from("watch_parties").insert({
      host_id: user.id,
      friend_id: friendUserId,
      movie_id: movie.id,
      status: "active",
      is_playing: true,
      current_time_sec: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to create watch party");
      return;
    }

    const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
    await sendNotification(
      friendUserId,
      "watch_party",
      "Watch Party Invite",
      `${myProfile?.display_name || "Someone"} invited you to watch "${movie.title}"`,
      { party_id: data.id, movie_id: movie.id }
    );

    toast.success(`Watch party started! ${invitingFriend.profile.display_name} will join automatically.`);
    setInvitingFriend(null);
    setMovieSearch("");
    navigate("/");
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

  const totalSentRequests = sentRequests.length + sentStaticRequests.length;
  const totalRequests = pendingRequests.length + totalSentRequests;

  const tabs = [
    { id: "friends" as const, label: "Friends", count: null },
    { id: "requests" as const, label: "Requests", count: totalRequests },
    { id: "search" as const, label: "Find Friends", count: null },
  ];

  const getSearchButtonContent = (profile: Profile) => {
    const status = relationshipMap[profile.user_id] || "none";
    switch (status) {
      case "accepted":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5" /> Friends
          </span>
        );
      case "pending_sent":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
            <Send className="w-3.5 h-3.5" /> Sent
          </span>
        );
      case "pending_received":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
            <UserPlus className="w-3.5 h-3.5" /> Respond
          </span>
        );
      default:
        return (
          <button
            onClick={() => sendFriendRequest(profile)}
            className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-10 md:pt-24 px-4 md:px-12 pb-24"
    >
      <h1 className="text-3xl md:text-4xl font-display tracking-wider text-foreground mb-4 md:mb-6">FRIENDS</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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

          {/* Search results */}
          <div className="space-y-2">
            {searching && <LoadingSpinner size="sm" text="Searching..." />}
            {!searching && searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <img
                  src={getAvatarUrl(profile.avatar_url, profile.display_name)}
                  alt={profile.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.unique_id}</p>
                </div>
                {getSearchButtonContent(profile)}
              </div>
            ))}
            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            )}
          </div>

          {/* Default suggestions - people you may know */}
          {!searchQuery && defaultSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">People you may know</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defaultSuggestions.map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/80 border border-border hover:border-primary/30 hover:bg-secondary hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default"
                  >
                    <div className="relative">
                      <img src={getAvatarUrl(profile.avatar_url, profile.display_name)} alt={profile.display_name} className="w-11 h-11 rounded-full object-cover" />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-secondary ${
                          profile.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{profile.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">{profile.unique_id}</p>
                      {profile.location?.trim() && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">📍 {profile.location}</p>
                      )}
                    </div>
                    <button
                      onClick={() => sendFriendRequest(profile)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Connect
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {!searchQuery && defaultSuggestions.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No suggestions available right now</p>
              <p className="text-xs text-muted-foreground mt-1">Add your location in profile settings to get better suggestions</p>
            </div>
          )}
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
              <div key={f.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                f.profile?.is_online 
                  ? "bg-green-500/5 border border-green-500/20 hover:bg-green-500/10" 
                  : "bg-secondary hover:bg-secondary/80"
              }`}>
                <div className="relative">
                  <img
                    src={getAvatarUrl(f.profile?.avatar_url, f.profile?.display_name)}
                    alt={f.profile?.display_name || "User"}
                    className="w-10 h-10 rounded-full object-cover bg-primary/10"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                      f.profile?.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.profile?.display_name}</p>
                  <p className={`text-xs ${f.profile?.is_online ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                    {f.profile?.is_online ? "Online" : "Offline"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (f.profile) {
                      navigate(`/chat/${f.profile.user_id}`);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                  title="Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                {onStartCall && (
                  <button
                    onClick={() => onStartCall(f.profile!.user_id, f.profile!.display_name)}
                    className={`p-2 rounded-full hover:bg-primary/20 transition-colors ${f.profile?.is_online ? "text-primary" : "text-muted-foreground"}`}
                    title={f.profile?.is_online ? "Video Call" : "Offline"}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setInvitingFriend(f)}
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
        <div className="space-y-5">
          {/* Incoming requests - shown first */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Incoming Requests ({pendingRequests.length})
              </h3>
              {pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-all duration-200"
                >
                  <div className="relative flex-shrink-0">
                    <img src={getAvatarUrl(req.profile?.avatar_url, req.profile?.display_name)} alt={req.profile?.display_name || "User"} className="w-11 h-11 rounded-full object-cover" />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                        req.profile?.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{req.profile?.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">{req.profile?.unique_id}</p>
                    {(req.profile as any)?.location?.trim() && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">📍 {(req.profile as any).location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => acceptRequest(req.id, req.profile)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => setDeclineTarget({ id: req.id, profile: req.profile })}
                      className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Sent requests */}
          {totalSentRequests > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Sent Requests ({totalSentRequests})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sentRequests.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex flex-col p-3 rounded-xl bg-secondary/80 border border-border hover:bg-secondary transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={getAvatarUrl(req.profile?.avatar_url, req.profile?.display_name)} alt={req.profile?.display_name || "User"} className="w-12 h-12 rounded-full object-cover" />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                            req.profile?.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{req.profile?.display_name}</p>
                        <p className="text-[11px] text-muted-foreground">{req.profile?.unique_id}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {req.profile?.location?.trim() && (
                            <p className="text-[10px] text-muted-foreground truncate">📍 {req.profile.location}</p>
                          )}
                          <span className={`text-[10px] font-medium ${req.profile?.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                            {req.profile?.is_online ? "● Online" : "● Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-amber-500 flex items-center gap-1 font-medium">
                        <Send className="w-2.5 h-2.5" /> Request Pending
                      </p>
                      <button
                        onClick={() => cancelSentRequest(req.id, req.profile)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-95 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </motion.div>
                ))}

                {sentStaticRequests.map((profile, i) => (
                  <motion.div
                    key={`static-sent-${profile.user_id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (sentRequests.length + i) * 0.04, duration: 0.25 }}
                    className="flex flex-col p-3 rounded-xl bg-secondary/80 border border-border hover:bg-secondary transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={getAvatarUrl(profile.avatar_url, profile.display_name)} alt={profile.display_name} className="w-12 h-12 rounded-full object-cover" />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                            profile.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{profile.display_name}</p>
                        <p className="text-[11px] text-muted-foreground">{profile.unique_id}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {profile.location?.trim() && (
                            <p className="text-[10px] text-muted-foreground truncate">📍 {profile.location}</p>
                          )}
                          <span className={`text-[10px] font-medium ${profile.is_online ? "text-green-500" : "text-muted-foreground"}`}>
                            {profile.is_online ? "● Online" : "● Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-amber-500 flex items-center gap-1 font-medium">
                        <Send className="w-2.5 h-2.5" /> Request Pending
                      </p>
                      <button
                        onClick={() => cancelStaticSentRequest(profile)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-95 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {pendingRequests.length === 0 && sentRequests.length === 0 && (
            <div className="text-center py-16">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending requests</p>
            </div>
          )}
        </div>
      )}

      {/* Watch Party Movie Picker Modal */}
      <AnimatePresence>
        {invitingFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
            onClick={() => { setInvitingFriend(null); setMovieSearch(""); setModalTab("movies"); }}
          >
            <motion.div
              initial={{ y: "100%", scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with avatar & gradient */}
              <div className="relative px-5 pt-5 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
                {/* Drag handle on mobile */}
                <div className="md:hidden w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(invitingFriend.profile?.avatar_url ?? null, invitingFriend.profile?.display_name ?? "User")}
                      alt={invitingFriend.profile?.display_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40"
                    />
                    {invitingFriend.profile?.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display tracking-wider text-foreground truncate">
                      Watch with {invitingFriend.profile?.display_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">Choose something to watch together 🍿</p>
                  </div>
                  <button
                    onClick={() => { setInvitingFriend(null); setMovieSearch(""); setModalTab("movies"); }}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    placeholder={`Search for a ${modalTab === "movies" ? "movie" : "series"}...`}
                    className="w-full bg-secondary/80 text-foreground placeholder:text-muted-foreground rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>

                {/* Movies / Series toggle + View toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalTab("movies")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        modalTab === "movies"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      Movies
                    </button>
                    <button
                      onClick={() => setModalTab("series")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        modalTab === "series"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      Series
                    </button>
                  </div>
                  <div className="flex gap-1 bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => setModalView("list")}
                      className={`p-1.5 rounded-md transition-colors ${
                        modalView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModalView("grid")}
                      className={`p-1.5 rounded-md transition-colors ${
                        modalView === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content list */}
              <div className="overflow-y-auto max-h-[62vh] px-3 pb-5 pt-1 space-y-1">
                {modalTab === "movies" && filteredMovies.map((movie) => (
                  <motion.button
                    key={movie.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleInviteToWatchParty(movie)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-primary/10 transition-all text-left group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-14 h-20 rounded-lg object-cover shadow-md group-hover:shadow-primary/20 transition-shadow"
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                        <Film className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{movie.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{movie.year} • {movie.genre.slice(0, 2).join(", ")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">{movie.duration}</span>
                        <span className="text-[11px] text-muted-foreground">⭐ {movie.rating}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {modalTab === "series" && filteredSeries.map((series) => (
                  <motion.button
                    key={series.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleInviteToWatchParty({
                      id: series.id,
                      title: series.title,
                      description: series.description,
                      poster: series.poster_url,
                      year: series.release_year,
                      genre: series.genre,
                      rating: series.rating,
                      duration: `${series.seasons?.length || 0} Season${(series.seasons?.length || 0) !== 1 ? "s" : ""}`,
                      language: "",
                      category: [],
                      isSeries: true,
                      isTrending: false,
                      isFeatured: false,
                      isEditorChoice: false,
                    } as Movie)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-primary/10 transition-all text-left group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={series.poster_url}
                        alt={series.title}
                        className="w-14 h-20 rounded-lg object-cover shadow-md group-hover:shadow-primary/20 transition-shadow"
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                        <Tv className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{series.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{series.release_year} • {series.genre.slice(0, 2).join(", ")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                          {series.seasons?.length || 0} Season{(series.seasons?.length || 0) !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[11px] text-muted-foreground">⭐ {series.rating}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {((modalTab === "movies" && filteredMovies.length === 0) || (modalTab === "series" && filteredSeries.length === 0)) && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    {modalTab === "movies" ? <Film className="w-10 h-10 mb-3 opacity-40" /> : <Tv className="w-10 h-10 mb-3 opacity-40" />}
                    <p className="text-sm">No {modalTab} found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decline confirmation dialog */}
      <AlertDialog open={!!declineTarget} onOpenChange={(open) => { if (!open) setDeclineTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline friend request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the request from {declineTarget?.profile?.display_name || "this user"}. They will be notified. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (declineTarget) {
                  declineRequest(declineTarget.id, declineTarget.profile);
                  setDeclineTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
