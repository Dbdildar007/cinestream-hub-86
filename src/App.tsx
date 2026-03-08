import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import FloatingVideoCall from "./components/FloatingVideoCall";
import IncomingCallOverlay from "./components/IncomingCallOverlay";
import { useVideoCall } from "./hooks/useVideoCall";
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
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function AppContent() {
  const { callState, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleMinimize } = useVideoCall();

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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
