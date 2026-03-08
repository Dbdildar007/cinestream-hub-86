import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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

async function fetchFriends(userId: string): Promise<Friendship[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!data || data.length === 0) return [];

  const friendUserIds = data.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", friendUserIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  return data.map(f => {
    const friendUserId = f.requester_id === userId ? f.addressee_id : f.requester_id;
    return { ...f, profile: profileMap.get(friendUserId) || undefined };
  });
}

async function fetchPendingRequests(userId: string): Promise<Friendship[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("addressee_id", userId)
    .eq("status", "pending");

  if (!data || data.length === 0) return [];

  const requesterIds = data.map(f => f.requester_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", requesterIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  return data.map(f => ({
    ...f,
    profile: profileMap.get(f.requester_id) || undefined,
  }));
}

async function fetchSentRequests(userId: string): Promise<Friendship[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", userId)
    .eq("status", "pending");

  if (!data || data.length === 0) return [];

  const addresseeIds = data.map(f => f.addressee_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", addresseeIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  return data.map(f => ({
    ...f,
    profile: profileMap.get(f.addressee_id) || undefined,
  }));
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const pendingQuery = useQuery({
    queryKey: ["pending-requests", user?.id],
    queryFn: () => fetchPendingRequests(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const sentQuery = useQuery({
    queryKey: ["sent-requests", user?.id],
    queryFn: () => fetchSentRequests(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    queryClient.invalidateQueries({ queryKey: ["sent-requests"] });
  };

  return {
    friends: friendsQuery.data || [],
    pendingRequests: pendingQuery.data || [],
    sentRequests: sentQuery.data || [],
    loading: friendsQuery.isLoading,
    invalidate,
  };
}
