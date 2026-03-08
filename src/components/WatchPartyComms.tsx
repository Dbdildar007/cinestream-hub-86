import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, MessageCircle,
  Minimize2, Maximize2, Send, Smile, X, Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl } from "@/utils/avatarUrl";

interface ChatMsg {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
}

const EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "😱", "🎬", "🍿"];

interface WatchPartyCommsProps {
  friendUserId: string;
  friendName: string;
  friendAvatarUrl?: string | null;
}

export default function WatchPartyComms({ friendUserId, friendName, friendAvatarUrl }: WatchPartyCommsProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);

  // Audio/Video state (local only — no WebRTC, uses Supabase broadcast for signaling)
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Start local media stream
  const startMedia = useCallback(async (video: boolean, audio: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      return null;
    }
  }, []);

  // Initialize audio on mount
  useEffect(() => {
    startMedia(false, true);
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    } else {
      startMedia(isCameraOff ? false : true, true).then(stream => {
        if (stream) setIsMuted(false);
      });
    }
  }, [localStream, isCameraOff, startMedia]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (isCameraOff) {
      // Turn on camera
      if (localStream) {
        // Add video track
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          localStream.addTrack(videoTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        } catch { return; }
      } else {
        await startMedia(true, true);
      }
      setIsCameraOff(false);
    } else {
      // Turn off camera
      localStream?.getVideoTracks().forEach(t => {
        t.stop();
        localStream.removeTrack(t);
      });
      setIsCameraOff(true);
    }
  }, [isCameraOff, localStream, startMedia]);

  // Load chat messages
  useEffect(() => {
    if (!user || !friendUserId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          text: m.message,
          isMine: m.sender_id === user.id,
          timestamp: m.created_at,
        })));
      }
    };
    loadMessages();

    const channel = supabase
      .channel(`wp-chat-${[user.id, friendUserId].sort().join("-")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload) => {
        const m = payload.new as any;
        if (
          (m.sender_id === user.id && m.receiver_id === friendUserId) ||
          (m.sender_id === friendUserId && m.receiver_id === user.id)
        ) {
          setMessages(prev => {
            if (prev.some(p => p.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              text: m.message,
              isMine: m.sender_id === user.id,
              timestamp: m.created_at,
            }];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, friendUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    const text = chatInput.trim();
    setChatInput("");
    setShowEmojis(false);
    await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: friendUserId,
      message: text,
    } as any);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Minimized pill
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-[95]"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border rounded-full px-3.5 py-2 shadow-xl hover:bg-card transition-colors"
        >
          <div className="relative">
            <img
              src={getAvatarUrl(friendAvatarUrl, friendName)}
              alt={friendName}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <span className="text-xs font-medium text-foreground max-w-[80px] truncate">{friendName}</span>
          <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-[95] w-[300px] md:w-[340px] flex flex-col bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ maxHeight: showChat ? "520px" : "auto" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={getAvatarUrl(friendAvatarUrl, friendName)}
              alt={friendName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{friendName}</p>
            <p className="text-[10px] text-muted-foreground">Watching together</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Video area */}
      <div className="relative aspect-[16/10] bg-secondary/50">
        {/* Friend's placeholder (no WebRTC in this scope) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <img
              src={getAvatarUrl(friendAvatarUrl, friendName)}
              alt={friendName}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
            />
            <p className="text-xs text-muted-foreground">{friendName}'s camera</p>
          </div>
        </div>

        {/* Local video PiP */}
        <div className="absolute bottom-2 right-2 w-20 h-14 rounded-lg overflow-hidden border-2 border-border bg-secondary shadow-lg">
          {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
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
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-1.5 px-3 py-2 border-b border-border">
        <button
          onClick={toggleMic}
          className={`p-2 rounded-full transition-colors ${
            isMuted ? "bg-destructive text-destructive-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleCamera}
          className={`p-2 rounded-full transition-colors ${
            isCameraOff ? "bg-secondary hover:bg-secondary/80 text-foreground" : "bg-primary text-primary-foreground"
          }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowChat(prev => !prev)}
          className={`p-2 rounded-full transition-colors relative ${
            showChat ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
          }`}
          title="Toggle chat"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 260 }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div ref={chatContainerRef} className="h-[205px] overflow-y-auto p-2.5 space-y-1.5 scrollbar-hide">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Say something while watching! 🍿
                </p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.isMine ? "text-right" : "text-left"}`}>
                    <span
                      className={`inline-block px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${
                        msg.isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-secondary-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-0.5 px-1">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-1.5 px-2.5 pb-1"
                >
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setChatInput(prev => prev + emoji);
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

            {/* Input */}
            <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
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
