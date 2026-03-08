import { useState, useEffect } from "react";
import { UserPlus, Send, UserCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SuggestedProfile {
  id: string;
  user_id: string;
  display_name: string;
  unique_id: string;
  avatar_url: string | null;
}

type Status = "none" | "sent" | "friends";

export default function FriendSuggestions() {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!user) return;
    loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;

    // Get existing friends/requests
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const connectedIds = new Set<string>();
    const map: Record<string, Status> = {};
    (friendships || []).forEach(f => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      connectedIds.add(otherId);
      if (f.status === "accepted") map[otherId] = "friends";
      else if (f.requester_id === user.id) map[otherId] = "sent";
    });

    // Get random profiles excluding self and existing connections
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, unique_id, avatar_url")
      .neq("user_id", user.id)
      .limit(20);

    const filtered = (profiles || []).filter(p => !connectedIds.has(p.user_id));
    // Shuffle and take 6
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 6);
    setSuggestions(shuffled);
    setStatusMap(map);
  };

  const sendRequest = async (profile: SuggestedProfile) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profile.user_id,
    });
    if (error) {
      toast.error("Could not send request");
      return;
    }
    setStatusMap(prev => ({ ...prev, [profile.user_id]: "sent" }));
    const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
    await sendNotification(
      profile.user_id, "friend_request", "Friend Request",
      `${myProfile?.display_name || "Someone"} sent you a friend request`,
      { requester_id: user.id }
    );
    toast.success("Request sent!");
  };

  if (!user || suggestions.length === 0) return null;

  return (
    <div className="mt-6 px-4 md:px-12">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display tracking-wider text-foreground">FIND FRIENDS</h2>
        <button
          onClick={() => navigate("/friends")}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {suggestions.map((profile) => {
          const status = statusMap[profile.user_id] || "none";
          return (
            <div
              key={profile.id}
              className="flex-shrink-0 w-[130px] flex flex-col items-center p-4 rounded-2xl bg-secondary border border-border/50"
            >
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-2.5 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-display text-primary">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground truncate w-full text-center">
                {profile.display_name}
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">{profile.unique_id}</p>

              {status === "friends" ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                  <UserCheck className="w-3 h-3" /> Friends
                </span>
              ) : status === "sent" ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                  <Send className="w-3 h-3" /> Sent
                </span>
              ) : (
                <button
                  onClick={() => sendRequest(profile)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
