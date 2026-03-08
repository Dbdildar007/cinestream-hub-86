import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWatchParty, type PartyPhase } from "@/hooks/useWatchParty";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/services/movieService";

interface PendingInvite {
  partyId: string;
  movieId: string;
  movieTitle: string;
  hostName: string;
  hostId: string;
}

interface WatchPartyContextType {
  playingMovie: Movie | null;
  activeParty: ReturnType<typeof useWatchParty>["activeParty"];
  isHost: boolean;
  partyPhase: PartyPhase;
  friendName: string;
  friendUserId: string;
  pendingInvite: PendingInvite | null;
  startWatchParty: (movie: Movie, partyId: string, friendDisplayName: string, friendId: string) => void;
  acceptInvite: () => Promise<void>;
  declineInvite: () => Promise<void>;
  closePlayer: () => void;
  syncPlayback: ReturnType<typeof useWatchParty>["syncPlayback"];
  forceSyncPlayback: ReturnType<typeof useWatchParty>["forceSyncPlayback"];
  endParty: ReturnType<typeof useWatchParty>["endParty"];
  onSyncReceived: ReturnType<typeof useWatchParty>["onSyncReceived"];
  onPhaseChange: ReturnType<typeof useWatchParty>["onPhaseChange"];
  signalReady: ReturnType<typeof useWatchParty>["signalReady"];
}

const WatchPartyContext = createContext<WatchPartyContextType | null>(null);

export function useWatchPartyContext() {
  const ctx = useContext(WatchPartyContext);
  if (!ctx) throw new Error("useWatchPartyContext must be used within WatchPartyProvider");
  return ctx;
}

export function WatchPartyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { allMovies } = useMovies();
  const watchParty = useWatchParty();
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [friendName, setFriendName] = useState("");
  const [friendUserId, setFriendUserId] = useState("");

  // Host starts a watch party — open player in "waiting" phase
  const startWatchParty = useCallback((movie: Movie, partyId: string, friendDisplayName: string) => {
    setFriendName(friendDisplayName);
    watchParty.joinParty(partyId, true); // host joins as host
    setPlayingMovie(movie);
  }, [watchParty]);

  // Listen for incoming watch party invites
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("wp-invite-global")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "watch_parties",
        filter: `friend_id=eq.${user.id}`,
      }, async (payload) => {
        const party = payload.new as any;
        if (party.status !== "active") return;

        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", party.host_id)
          .single();

        const movie = allMovies.find(m => m.id === party.movie_id);

        setPendingInvite({
          partyId: party.id,
          movieId: party.movie_id,
          movieTitle: movie?.title || "a movie",
          hostName: hostProfile?.display_name || "Someone",
          hostId: party.host_id,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, allMovies]);

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite) return;
    setFriendName(pendingInvite.hostName);
    const joined = await watchParty.joinParty(pendingInvite.partyId, false);
    if (joined) {
      const movie = allMovies.find(m => m.id === pendingInvite.movieId);
      if (movie) {
        setPlayingMovie(movie);
        // Signal ready to host after a brief delay for player to mount
        setTimeout(() => {
          watchParty.signalReady();
        }, 1500);
      }
    }
    setPendingInvite(null);
  }, [pendingInvite, watchParty, allMovies]);

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return;
    await supabase.from("watch_parties").delete().eq("id", pendingInvite.partyId);
    setPendingInvite(null);
  }, [pendingInvite]);

  const closePlayer = useCallback(() => {
    if (watchParty.activeParty) {
      watchParty.endParty();
    }
    setPlayingMovie(null);
    setFriendName("");
  }, [watchParty]);

  // Listen for party end phase from other user
  useEffect(() => {
    watchParty.onPhaseChange((phase) => {
      if (phase === "ended") {
        setPlayingMovie(null);
        setFriendName("");
      }
    });
  }, [watchParty.onPhaseChange]);

  return (
    <WatchPartyContext.Provider value={{
      playingMovie,
      activeParty: watchParty.activeParty,
      isHost: watchParty.isHost,
      partyPhase: watchParty.partyPhase,
      friendName,
      pendingInvite,
      startWatchParty,
      acceptInvite,
      declineInvite,
      closePlayer,
      syncPlayback: watchParty.syncPlayback,
      forceSyncPlayback: watchParty.forceSyncPlayback,
      endParty: watchParty.endParty,
      onSyncReceived: watchParty.onSyncReceived,
      onPhaseChange: watchParty.onPhaseChange,
      signalReady: watchParty.signalReady,
    }}>
      {children}
    </WatchPartyContext.Provider>
  );
}
