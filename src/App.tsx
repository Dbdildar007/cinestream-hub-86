import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import FloatingVideoCall from "./components/FloatingVideoCall";
import IncomingCallOverlay from "./components/IncomingCallOverlay";
import { useVideoCall } from "./hooks/useVideoCall";
import { useAuth } from "./hooks/useAuth";
import { useDeviceSession } from "./hooks/useDeviceSession";
import { EvictedDialog } from "./components/EvictedDialog";
import { WatchPartyProvider, useWatchPartyContext } from "./contexts/WatchPartyContext";
import WatchPartyInviteOverlay from "./components/WatchPartyInviteOverlay";
import VideoPlayer from "./components/VideoPlayer";
import WatchPartyCountdown from "./components/WatchPartyCountdown";
import WatchPartyComms from "./components/WatchPartyComms";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import FoldersPage from "./pages/FoldersPage";
import DownloadsPage from "./pages/DownloadsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import FriendsPage from "./pages/FriendsPage";
import WatchlistPage from "./pages/WatchlistPage";
import WatchHistoryPage from "./pages/WatchHistoryPage";
import MyRatingsPage from "./pages/MyRatingsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChatPage from "./pages/ChatPage";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function AppContent() {
  const { callState, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleMinimize } = useVideoCall();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEvicted, setShowEvicted] = useState(false);
  const wpCtx = useWatchPartyContext();

  const handleEvicted = useCallback(async () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('cinestream_watchlist');
    localStorage.removeItem('cinestream-ratings');
    localStorage.removeItem('cinestream_watch_progress');
    await supabase.auth.signOut({ scope: 'local' });
    setShowEvicted(true);
  }, []);

  const { registerDevice } = useDeviceSession(user?.id, handleEvicted);

  const hasReregistered = useRef(false);
  useEffect(() => {
    if (user?.id && !hasReregistered.current) {
      hasReregistered.current = true;
      registerDevice(false, user.id);
    }
    if (!user) {
      hasReregistered.current = false;
    }
  }, [user?.id, registerDevice]);

  const handleEvictedAcknowledge = async () => {
    setShowEvicted(false);
    navigate("/auth", { replace: true });
  };

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/friends" element={<FriendsPage onStartCall={startCall} />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/watch-history" element={<WatchHistoryPage />} />
        <Route path="/my-ratings" element={<MyRatingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/chat/:userId" element={<ChatPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />

      <AnimatePresence>
        {callState.status === "incoming" && (
          <IncomingCallOverlay
            callerName={callState.remoteDisplayName}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}
      </AnimatePresence>

      <FloatingVideoCall
        callState={callState}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleMinimize={toggleMinimize}
        onEndCall={endCall}
      />

      {/* Watch Party Invite Overlay */}
      <WatchPartyInviteOverlay />

      {/* Watch Party Video Player - renders at App level */}
      <AnimatePresence>
        {wpCtx.playingMovie && (
          <div className="fixed inset-0 z-[90]">
            <VideoPlayer
              movie={wpCtx.playingMovie}
              onClose={wpCtx.closePlayer}
              watchPartyActive={!!wpCtx.activeParty}
              isHost={wpCtx.isHost}
              onSyncPlayback={wpCtx.syncPlayback}
              onForceSyncPlayback={wpCtx.forceSyncPlayback}
              onSyncReceived={wpCtx.onSyncReceived}
              onEndParty={wpCtx.endParty}
              guestName={wpCtx.friendName}
              partyPhase={wpCtx.partyPhase}
            />
            <WatchPartyCountdown
              phase={wpCtx.partyPhase}
              isHost={wpCtx.isHost}
              friendName={wpCtx.friendName}
              movieTitle={wpCtx.playingMovie.title}
            />
          </div>
        )}
      </AnimatePresence>

      {showEvicted && (
        <EvictedDialog onAcknowledge={handleEvictedAcknowledge} />
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <WatchPartyProvider>
          <AppContent />
        </WatchPartyProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
