import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWatchParty, type PartyPhase } from "@/hooks/useWatchParty";
import { useMovies } from "@/hooks/useMovies";
import { useAllSeries, useSeriesDetail } from "@/hooks/useSeries";
import type { Movie } from "@/services/movieService";
import type { Series, SeriesEpisode } from "@/services/seriesService";

interface PendingInvite {
  partyId: string;
  movieId: string;
  movieTitle: string;
  hostName: string;
  hostId: string;
  episodeId?: string;
  receivedAt: number;
}

interface WatchPartyContextType {
  playingMovie: Movie | null;
  playingSeries: Series | null;
  playingEpisode: SeriesEpisode | null;
  playingSeasonNumber: number;
  activeParty: ReturnType<typeof useWatchParty>["activeParty"];
  isHost: boolean;
  partyPhase: PartyPhase;
  friendName: string;
  friendUserId: string;
  pendingInvite: PendingInvite | null;
  inviteTimeRemaining: number;
  startWatchParty: (movie: Movie, partyId: string, friendDisplayName: string, friendId: string, episode?: SeriesEpisode, series?: Series, seasonNumber?: number) => void;
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
  onEpisodeChangeReceived: ReturnType<typeof useWatchParty>["onEpisodeChangeReceived"];
  broadcastEpisodeChange: ReturnType<typeof useWatchParty>["broadcastEpisodeChange"];
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
  const { allSeries } = useAllSeries();
  const watchParty = useWatchParty();
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<SeriesEpisode | null>(null);
  const [playingSeasonNumber, setPlayingSeasonNumber] = useState(1);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [friendName, setFriendName] = useState("");
  const [friendUserId, setFriendUserId] = useState("");
  const [inviteTimeRemaining, setInviteTimeRemaining] = useState(INVITE_TIMEOUT_SEC);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // For resolving series details when accepting an invite
  const [pendingSeriesId, setPendingSeriesId] = useState<string | null>(null);
  const { series: pendingSeriesDetail } = useSeriesDetail(pendingSeriesId);

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

  const startWatchParty = useCallback((movie: Movie, partyId: string, friendDisplayName: string, friendId: string, episode?: SeriesEpisode, series?: Series, seasonNumber?: number) => {
    setFriendName(friendDisplayName);
    setFriendUserId(friendId);
    watchParty.joinParty(partyId, true);
    if (movie.isSeries && episode && series) {
      setPlayingSeries(series);
      setPlayingEpisode(episode);
      setPlayingSeasonNumber(seasonNumber || 1);
      setPlayingMovie(null);
    } else {
      setPlayingMovie(movie);
      setPlayingSeries(null);
      setPlayingEpisode(null);
    }
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
        const series = allSeries.find(s => s.id === party.movie_id);

        setPendingInvite({
          partyId: party.id,
          movieId: party.movie_id,
          movieTitle: movie?.title || series?.title || "a movie",
          hostName: hostProfile?.display_name || "Someone",
          hostId: party.host_id,
          episodeId: party.episode_id || undefined,
          receivedAt: Date.now(),
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, allMovies, allSeries]);

  // Listen for episode change broadcasts (for guest)
  useEffect(() => {
    watchParty.onEpisodeChangeReceived((data) => {
      setPlayingEpisode(data.episode);
      setPlayingSeasonNumber(data.seasonNumber);
    });
  }, [watchParty.onEpisodeChangeReceived]);

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite) return;
    setFriendName(pendingInvite.hostName);
    setFriendUserId(pendingInvite.hostId);
    const joined = await watchParty.joinParty(pendingInvite.partyId, false);
    if (joined) {
      const movie = allMovies.find(m => m.id === pendingInvite.movieId);
      const seriesMatch = allSeries.find(s => s.id === pendingInvite.movieId);

      if (seriesMatch && pendingInvite.episodeId) {
        // Need to fetch full series detail to find the episode
        setPendingSeriesId(pendingInvite.movieId);
        // We'll resolve the episode in the effect below
        setPlayingSeries({
          ...seriesMatch,
          seasons: seriesMatch.seasons || [],
        });
        setPlayingMovie(null);
      } else if (movie) {
        setPlayingMovie(movie);
        setPlayingSeries(null);
        setPlayingEpisode(null);
      }

      setTimeout(() => {
        watchParty.signalReady();
      }, 1500);
    }
    const savedInvite = { ...pendingInvite };
    setPendingInvite(null);
    
    // Store episodeId for resolution
    if (savedInvite.episodeId) {
      (window as any).__wpPendingEpisodeId = savedInvite.episodeId;
    }
  }, [pendingInvite, watchParty, allMovies, allSeries]);

  // Resolve episode when series detail loads for guest
  useEffect(() => {
    if (!pendingSeriesDetail || !pendingSeriesId) return;
    const epId = (window as any).__wpPendingEpisodeId;
    if (!epId) return;

    for (const season of pendingSeriesDetail.seasons) {
      const ep = season.episodes.find(e => e.id === epId);
      if (ep) {
        setPlayingEpisode(ep);
        setPlayingSeasonNumber(season.number);
        setPlayingSeries(pendingSeriesDetail);
        break;
      }
    }
    delete (window as any).__wpPendingEpisodeId;
    setPendingSeriesId(null);
  }, [pendingSeriesDetail, pendingSeriesId]);

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return;
    await supabase.from("watch_parties").delete().eq("id", pendingInvite.partyId);
    setPendingInvite(null);
  }, [pendingInvite]);

  const ignoreInvite = useCallback(() => {
    setPendingInvite(null);
  }, []);

  const closePlayer = useCallback(() => {
    if (watchParty.activeParty) {
      watchParty.endParty();
    }
    setPlayingMovie(null);
    setPlayingSeries(null);
    setPlayingEpisode(null);
    setFriendName("");
    setFriendUserId("");
  }, [watchParty]);

  useEffect(() => {
    watchParty.onPhaseChange((phase) => {
      if (phase === "ended") {
        setPlayingMovie(null);
        setPlayingSeries(null);
        setPlayingEpisode(null);
        setFriendName("");
        setFriendUserId("");
      }
    });
  }, [watchParty.onPhaseChange]);

  const isWatchingAnything = !!(playingMovie || (playingSeries && playingEpisode));

  return (
    <WatchPartyContext.Provider value={{
      playingMovie,
      playingSeries,
      playingEpisode,
      playingSeasonNumber,
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
      onEpisodeChangeReceived: watchParty.onEpisodeChangeReceived,
      broadcastEpisodeChange: watchParty.broadcastEpisodeChange,
    }}>
      {children}
    </WatchPartyContext.Provider>
  );
}