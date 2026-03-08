import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, UserCheck, Users, Circle, X, Send, Film, Phone, Loader2, CheckCircle } from "lucide-react";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/services/movieService";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  // Track relationship status per user_id in search
  const [relationshipMap, setRelationshipMap] = useState<Record<string, RelationshipStatus>>({});

  // Watch party invite state
  const [invitingFriend, setInvitingFriend] = useState<Friendship | null>(null);
  const [movieSearch, setMovieSearch] = useState("");
  const [declineTarget, setDeclineTarget] = useState<{ id: string; profile?: Profile } | null>(null);

  const filteredMovies = movieSearch
    ? allMovies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase())).slice(0, 8)
    : allMovies.slice(0, 8);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (data && data.length > 0) {
      const friendUserIds = data.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", friendUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const friendsWithProfiles = data.map(f => {
        const friendUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        return { ...f, profile: profileMap.get(friendUserId) || undefined };
      });
      setFriends(friendsWithProfiles);
    } else {
      setFriends([]);
    }
    setLoading(false);
  }, [user]);

  const loadPendingRequests = useCallback(async () => {
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
  }, [user]);

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
        // Refresh search results relationship status
        if (searchResults.length > 0) buildRelationshipMap(searchResults);
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
  }, [user, loadFriends, loadPendingRequests]);

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
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.user_id,
    });
    if (error) {
      toast.error("Could not send request. Maybe already sent?");
    } else {
      // Update local relationship map immediately
      setRelationshipMap(prev => ({ ...prev, [profile.user_id]: "pending_sent" }));
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
      loadFriends();
      loadPendingRequests();
    }
  };

  const declineRequest = async (friendshipId: string, requesterProfile?: Profile) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (!error) {
      // Notify the sender about the rejection
      if (requesterProfile && user) {
        const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
        await sendNotification(
          requesterProfile.user_id,
          "friend_request",
          "Request Declined",
          `${myProfile?.display_name || "Someone"} declined your friend request`
        );
      }
      loadPendingRequests();
    }
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

  const tabs = [
    { id: "friends" as const, label: "Friends", count: friends.length },
    { id: "requests" as const, label: "Requests", count: pendingRequests.length },
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
                {getSearchButtonContent(profile)}
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
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
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
                  onClick={() => setDeclineTarget({ id: req.id, profile: req.profile })}
                  className="p-2 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
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
            className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => { setInvitingFriend(null); setMovieSearch(""); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-display tracking-wider text-foreground">
                    Watch with {invitingFriend.profile?.display_name}
                  </h3>
                  <button onClick={() => { setInvitingFriend(null); setMovieSearch(""); }}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    placeholder="Search for a movie..."
                    className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-2">
                {filteredMovies.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleInviteToWatchParty(movie)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-12 h-16 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{movie.year} • {movie.genre.join(", ")}</p>
                      <p className="text-xs text-primary">{movie.duration}</p>
                    </div>
                    <Film className="w-4 h-4 text-primary flex-shrink-0" />
                  </button>
                ))}
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
