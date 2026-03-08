import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
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
  receivedAt: number; // timestamp for countdown
}

interface WatchPartyContextType {
  playingMovie: Movie | null;
  activeParty: ReturnType<typeof useWatchParty>["activeParty"];
  isHost: boolean;
  partyPhase: PartyPhase;
  friendName: string;
  friendUserId: string;
  pendingInvite: PendingInvite | null;
  inviteTimeRemaining: number;
  startWatchParty: (movie: Movie, partyId: string, friendDisplayName: string, friendId: string) => void;
  acceptInvite: () => Promise<void>;
  declineInvite: () => Promise<void>;
  ignoreInvite: () => void;
  closePlayer: () => void;
  syncPlayback: ReturnType<typeof useWatchParty>["syncPlayback"];
  forceSyncPlayback: ReturnType<typeof useWatchParty>["forceSyncPlayback"];
  endParty: ReturnType<typeof useWatchParty>["endParty"];
  onSyncReceived: ReturnType<typeof useWatchParty>["onSyncReceived"];
  onPhaseChange: ReturnType<typeof useWatchParty>["onPhaseChange"];
  signalReady: ReturnType<typeof useWatchParty>["signalReady"];
}

const INVITE_TIMEOUT_SEC = 30;

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
  const [inviteTimeRemaining, setInviteTimeRemaining] = useState(INVITE_TIMEOUT_SEC);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-expiry countdown for pending invites
  useEffect(() => {
    if (!pendingInvite) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setInviteTimeRemaining(INVITE_TIMEOUT_SEC);
      return;
    }

    setInviteTimeRemaining(INVITE_TIMEOUT_SEC);
    countdownRef.current = setInterval(() => {
      setInviteTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-expire: silently dismiss (like ignore)
          setPendingInvite(null);
          return INVITE_TIMEOUT_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [pendingInvite]);

  const startWatchParty = useCallback((movie: Movie, partyId: string, friendDisplayName: string, friendId: string) => {
    setFriendName(friendDisplayName);
    setFriendUserId(friendId);
    watchParty.joinParty(partyId, true);
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
          receivedAt: Date.now(),
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, allMovies]);

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite) return;
    setFriendName(pendingInvite.hostName);
    setFriendUserId(pendingInvite.hostId);
    const joined = await watchParty.joinParty(pendingInvite.partyId, false);
    if (joined) {
      const movie = allMovies.find(m => m.id === pendingInvite.movieId);
      if (movie) {
        setPlayingMovie(movie);
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

  // Ignore = dismiss overlay without deleting the party (host keeps waiting)
  const ignoreInvite = useCallback(() => {
    setPendingInvite(null);
  }, []);

  const closePlayer = useCallback(() => {
    if (watchParty.activeParty) {
      watchParty.endParty();
    }
    setPlayingMovie(null);
    setFriendName("");
    setFriendUserId("");
  }, [watchParty]);

  useEffect(() => {
    watchParty.onPhaseChange((phase) => {
      if (phase === "ended") {
        setPlayingMovie(null);
        setFriendName("");
        setFriendUserId("");
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
      friendUserId,
      pendingInvite,
      inviteTimeRemaining,
      startWatchParty,
      acceptInvite,
      declineInvite,
      ignoreInvite,
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
