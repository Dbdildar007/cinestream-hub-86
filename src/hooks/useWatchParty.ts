import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WatchPartyState {
  id: string;
  hostId: string;
  friendId: string;
  movieId: string;
  isPlaying: boolean;
  currentTimeSec: number;
  status: string;
}

export function useWatchParty() {
  const { user } = useAuth();
  const [activeParty, setActiveParty] = useState<WatchPartyState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const syncCallbackRef = useRef<((state: { isPlaying: boolean; currentTimeSec: number }) => void) | null>(null);
  const lastSyncRef = useRef(0);

  // Listen for watch party changes targeting this user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("watch-party-updates")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "watch_parties",
        filter: `friend_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "DELETE") {
          if (activeParty?.id === (payload.old as any)?.id) {
            endParty();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeParty]);

  const createParty = useCallback(async (friendId: string, movieId: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("watch_parties")
      .insert({
        host_id: user.id,
        friend_id: friendId,
        movie_id: movieId,
        status: "active",
        is_playing: true,
        current_time_sec: 0,
      })
      .select()
      .single();

    if (error || !data) return null;

    const party: WatchPartyState = {
      id: data.id,
      hostId: data.host_id,
      friendId: data.friend_id,
      movieId: data.movie_id,
      isPlaying: data.is_playing,
      currentTimeSec: data.current_time_sec,
      status: data.status,
    };
    setActiveParty(party);
    setIsHost(true);
    joinRealtimeChannel(party.id, true);
    return party;
  }, [user]);

  const joinParty = useCallback(async (partyId: string) => {
    const { data } = await supabase
      .from("watch_parties")
      .select("*")
      .eq("id", partyId)
      .single();

    if (!data) return null;

    const party: WatchPartyState = {
      id: data.id,
      hostId: data.host_id,
      friendId: data.friend_id,
      movieId: data.movie_id,
      isPlaying: data.is_playing,
      currentTimeSec: data.current_time_sec,
      status: data.status,
    };
    setActiveParty(party);
    setIsHost(false);
    joinRealtimeChannel(party.id, false);
    return party;
  }, []);

  const joinRealtimeChannel = (partyId: string, host: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`watch-party-${partyId}`, {
      config: { broadcast: { self: false } },
    });

    if (!host) {
      // Guest listens for sync commands from host
      channel.on("broadcast", { event: "sync" }, (payload) => {
        const { isPlaying, currentTimeSec } = payload.payload;
        setActiveParty(prev => prev ? { ...prev, isPlaying, currentTimeSec } : prev);
        syncCallbackRef.current?.({ isPlaying, currentTimeSec });
      });
    }

    channel.subscribe();
    channelRef.current = channel;
  };

  // Throttled sync - host sends max every 500ms
  const syncPlayback = useCallback((isPlaying: boolean, currentTimeSec: number) => {
    if (!channelRef.current || !isHost || !activeParty) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 500) return;
    lastSyncRef.current = now;

    channelRef.current.send({
      type: "broadcast",
      event: "sync",
      payload: { isPlaying, currentTimeSec },
    });
    // Persist to DB less frequently
    supabase.from("watch_parties").update({
      is_playing: isPlaying,
      current_time_sec: currentTimeSec,
    }).eq("id", activeParty.id).then();
  }, [isHost, activeParty]);

  // Force sync for play/pause/seek (immediate)
  const forceSyncPlayback = useCallback((isPlaying: boolean, currentTimeSec: number) => {
    if (!channelRef.current || !isHost || !activeParty) return;
    lastSyncRef.current = Date.now();
    channelRef.current.send({
      type: "broadcast",
      event: "sync",
      payload: { isPlaying, currentTimeSec },
    });
    supabase.from("watch_parties").update({
      is_playing: isPlaying,
      current_time_sec: currentTimeSec,
    }).eq("id", activeParty.id).then();
  }, [isHost, activeParty]);

  const endParty = useCallback(async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (activeParty) {
      // Save to watch party history
      if (user) {
        await supabase.from("watch_party_history").insert({
          host_id: activeParty.hostId,
          friend_id: activeParty.friendId,
          movie_id: activeParty.movieId,
          duration_watched_sec: activeParty.currentTimeSec,
          ended_at: new Date().toISOString(),
        });
      }
      await supabase.from("watch_parties").delete().eq("id", activeParty.id);
    }
    setActiveParty(null);
    setIsHost(false);
  }, [activeParty, user]);

  const onSyncReceived = useCallback((cb: (state: { isPlaying: boolean; currentTimeSec: number }) => void) => {
    syncCallbackRef.current = cb;
  }, []);

  return {
    activeParty,
    isHost,
    createParty,
    joinParty,
    syncPlayback,
    forceSyncPlayback,
    endParty,
    onSyncReceived,
  };
}
