import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { SeriesEpisode } from "@/services/seriesService";

export type PartyPhase = "waiting" | "countdown" | "playing" | "ended";

export interface WatchPartyState {
  id: string;
  hostId: string;
  friendId: string;
  movieId: string;
  isPlaying: boolean;
  currentTimeSec: number;
  status: string;
  episodeId?: string;
}

export function useWatchParty() {
  const { user } = useAuth();
  const [activeParty, setActiveParty] = useState<WatchPartyState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [partyPhase, setPartyPhase] = useState<PartyPhase>("waiting");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const syncCallbackRef = useRef<((state: { isPlaying: boolean; currentTimeSec: number }) => void) | null>(null);
  const phaseCallbackRef = useRef<((phase: PartyPhase) => void) | null>(null);
  const episodeChangeCallbackRef = useRef<((data: { episode: SeriesEpisode; seasonNumber: number }) => void) | null>(null);
  const lastSyncRef = useRef(0);

  // Listen for watch party deletions targeting this user
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

  const joinRealtimeChannel = useCallback((partyId: string, host: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`watch-party-${partyId}`, {
      config: { broadcast: { self: false } },
    });

    // Both host and guest listen for phase events
    channel.on("broadcast", { event: "party-phase" }, (payload) => {
      const phase = payload.payload.phase as PartyPhase;
      setPartyPhase(phase);
      phaseCallbackRef.current?.(phase);
    });

    // Both listen for episode change events
    channel.on("broadcast", { event: "episode-change" }, (payload) => {
      const { episode, seasonNumber } = payload.payload;
      episodeChangeCallbackRef.current?.({ episode, seasonNumber });
    });

    if (!host) {
      // Guest listens for sync commands from host
      channel.on("broadcast", { event: "sync" }, (payload) => {
        const { isPlaying, currentTimeSec } = payload.payload;
        setActiveParty(prev => prev ? { ...prev, isPlaying, currentTimeSec } : prev);
        syncCallbackRef.current?.({ isPlaying, currentTimeSec });
      });
    }

    if (host) {
      // Host listens for guest "ready" signal
      channel.on("broadcast", { event: "guest-ready" }, () => {
        startCountdown();
      });
    }

    channel.subscribe();
    channelRef.current = channel;
  }, []);

  const startCountdown = useCallback(() => {
    setPartyPhase("countdown");
    channelRef.current?.send({
      type: "broadcast",
      event: "party-phase",
      payload: { phase: "countdown" },
    });

    setTimeout(() => {
      setPartyPhase("playing");
      channelRef.current?.send({
        type: "broadcast",
        event: "party-phase",
        payload: { phase: "playing" },
      });
      phaseCallbackRef.current?.("playing");
    }, 3500);
  }, []);

  const joinParty = useCallback(async (partyId: string, asHost = false) => {
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
      episodeId: (data as any).episode_id || undefined,
    };
    setActiveParty(party);
    setIsHost(asHost);
    setPartyPhase("waiting");
    joinRealtimeChannel(party.id, asHost);
    return party;
  }, [joinRealtimeChannel]);

  const signalReady = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "guest-ready",
      payload: {},
    });
  }, []);

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

  // Host broadcasts episode change to guest
  const broadcastEpisodeChange = useCallback((episode: SeriesEpisode, seasonNumber: number) => {
    if (!channelRef.current || !isHost || !activeParty) return;
    channelRef.current.send({
      type: "broadcast",
      event: "episode-change",
      payload: { episode, seasonNumber },
    });
    // Update DB too
    supabase.from("watch_parties").update({
      episode_id: episode.id,
      current_time_sec: 0,
    } as any).eq("id", activeParty.id).then();
  }, [isHost, activeParty]);

  const endParty = useCallback(async () => {
    channelRef.current?.send({
      type: "broadcast",
      event: "party-phase",
      payload: { phase: "ended" },
    });

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (activeParty) {
      if (user) {
        await supabase.from("watch_party_history").insert({
          host_id: activeParty.hostId,
          friend_id: activeParty.friendId,
          movie_id: activeParty.movieId,
          ended_at: new Date().toISOString(),
        });
      }
      await supabase.from("watch_parties").delete().eq("id", activeParty.id);
    }
    setActiveParty(null);
    setIsHost(false);
    setPartyPhase("waiting");
  }, [activeParty, user]);

  const onSyncReceived = useCallback((cb: (state: { isPlaying: boolean; currentTimeSec: number }) => void) => {
    syncCallbackRef.current = cb;
  }, []);

  const onPhaseChange = useCallback((cb: (phase: PartyPhase) => void) => {
    phaseCallbackRef.current = cb;
  }, []);

  const onEpisodeChangeReceived = useCallback((cb: (data: { episode: SeriesEpisode; seasonNumber: number }) => void) => {
    episodeChangeCallbackRef.current = cb;
  }, []);

  return {
    activeParty,
    isHost,
    partyPhase,
    joinParty,
    signalReady,
    syncPlayback,
    forceSyncPlayback,
    broadcastEpisodeChange,
    endParty,
    onSyncReceived,
    onPhaseChange,
    onEpisodeChangeReceived,
  };
}