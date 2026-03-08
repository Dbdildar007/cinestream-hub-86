import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Minus, Maximize2, MessageCircle, Send, Smile
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CallState } from "@/hooks/useVideoCall";

interface FloatingVideoCallProps {
  callState: CallState;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleMinimize: () => void;
  onEndCall: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
}

const EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "😱", "🎬", "🍿"];

export default function FloatingVideoCall({
  callState,
  onToggleMute,
  onToggleCamera,
  onToggleMinimize,
  onEndCall,
}: FloatingVideoCallProps) {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  // Load existing messages and subscribe to realtime
  useEffect(() => {
    if (!user || !callState.remoteUserId || callState.status !== "connected") return;

    const remoteId = callState.remoteUserId;

    // Load existing messages between the two users
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${remoteId}),and(sender_id.eq.${remoteId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            text: m.message,
            isMine: m.sender_id === user.id,
            timestamp: m.created_at,
          }))
        );
      }
    };
    loadMessages();

    // Subscribe to new messages in realtime
    const channel = supabase
      .channel(`chat-${[user.id, remoteId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as any;
          // Only add if it's between us
          if (
            (m.sender_id === user.id && m.receiver_id === remoteId) ||
            (m.sender_id === remoteId && m.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  text: m.message,
                  isMine: m.sender_id === user.id,
                  timestamp: m.created_at,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, callState.remoteUserId, callState.status]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !user || !callState.remoteUserId) return;
    const text = chatInput.trim();
    setChatInput("");

    await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: callState.remoteUserId,
      message: text,
    } as any);
  };

  if (callState.status !== "connected") return null;

  if (callState.isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed top-4 right-4 z-[90] flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2 shadow-xl cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-foreground font-medium">
          {callState.remoteDisplayName}
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed top-4 right-4 z-[90] w-[280px] md:w-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Video feeds */}
      <div className="relative aspect-video bg-secondary">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!callState.remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {callState.remoteDisplayName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          </div>
        )}

        {/* Local video (PiP) */}
        <div className="absolute bottom-2 right-2 w-20 h-14 rounded-lg overflow-hidden border-2 border-border bg-secondary">
          {callState.isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
        </div>

        <div className="absolute top-2 left-2 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-foreground font-medium">
          {callState.remoteDisplayName}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-2 bg-card">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-full transition-colors ${
            callState.isMuted ? "bg-destructive text-destructive-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
          }`}
        >
          {callState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggleCamera}
          className={`p-2 rounded-full transition-colors ${
            callState.isCameraOff ? "bg-destructive text-destructive-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
          }`}
        >
          {callState.isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-full transition-colors relative ${
            showChat ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleMinimize}
          className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onEndCall}
          className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Chat overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 220 }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="h-[170px] overflow-y-auto p-2 space-y-1.5">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Send a message...</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs max-w-[80%] ${
                      msg.isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji row */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-1 px-2 pb-1"
                >
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setChatInput((prev) => prev + emoji);
                        setShowEmojis(false);
                      }}
                      className="text-base hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 px-2 pb-2">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type..."
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={sendMessage}
                className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
