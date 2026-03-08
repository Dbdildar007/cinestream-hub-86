import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Smile, Check, CheckCheck } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
  readAt: string | null;
}

const EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "😱", "🎬", "🍿", "👋", "😊", "🎉", "💯"];

export default function ChatPage() {
  const { userId: remoteUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const mapMessage = useCallback((m: any, userId: string): Message => ({
    id: m.id,
    text: m.message,
    isMine: m.sender_id === userId,
    timestamp: m.created_at,
    readAt: m.read_at || null,
  }), []);

  // Load remote profile
  useEffect(() => {
    if (!remoteUserId) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", remoteUserId)
      .single()
      .then(({ data }) => {
        if (data) setRemoteName(data.display_name);
      });
  }, [remoteUserId]);

  // Mark unread messages as read
  const markAsRead = useCallback(async () => {
    if (!user || !remoteUserId) return;
    await supabase
      .from("call_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("sender_id", remoteUserId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  }, [user, remoteUserId]);

  // Load messages and subscribe
  useEffect(() => {
    if (!user || !remoteUserId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("call_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${remoteUserId}),and(sender_id.eq.${remoteUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data.map((m: any) => mapMessage(m, user.id)));
      }
      // Mark incoming messages as read
      markAsRead();
    };
    loadMessages();

    // Realtime subscription for messages + typing
    const channelName = `chat-${[user.id, remoteUserId].sort().join("-")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_messages" },
        (payload) => {
          const m = payload.new as any;
          if (
            (m.sender_id === user.id && m.receiver_id === remoteUserId) ||
            (m.sender_id === remoteUserId && m.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === m.id)) return prev;
              return [...prev, mapMessage(m, user.id)];
            });
            // If incoming message, mark as read immediately
            if (m.sender_id === remoteUserId) {
              markAsRead();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_messages" },
        (payload) => {
          const m = payload.new as any;
          // Update read_at status
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === m.id ? { ...msg, readAt: m.read_at } : msg
            )
          );
        }
      )
      // Typing indicator via broadcast
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === remoteUserId) {
          setRemoteIsTyping(true);
          if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
          remoteTypingTimeoutRef.current = setTimeout(() => setRemoteIsTyping(false), 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Fallback polling every 3s
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("call_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${remoteUserId}),and(sender_id.eq.${remoteUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data.map((m: any) => mapMessage(m, user.id)));
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      channelRef.current = null;
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
    };
  }, [user, remoteUserId, mapMessage, markAsRead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteIsTyping]);

  // Broadcast typing indicator
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    broadcastTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !remoteUserId) return;
    const text = input.trim();
    setInput("");
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, isMine: true, timestamp: new Date().toISOString(), readAt: null },
    ]);
    const { data } = await supabase.from("call_messages").insert({
      sender_id: user.id,
      receiver_id: remoteUserId,
      message: text,
    } as any).select().single();
    if (data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? mapMessage(data as any, user.id) : m
        )
      );
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    navigate("/auth", { replace: true });
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col pt-16 md:pt-20 pb-20 md:pb-4"
    >
      {/* Header */}
      <div className="sticky top-16 md:top-20 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/friends")}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {remoteName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{remoteName || "Chat"}</h2>
          {remoteIsTyping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-primary"
            >
              typing...
            </motion.p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                msg.isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-secondary-foreground rounded-bl-sm"
              }`}
            >
              <p className="text-sm break-words">{msg.text}</p>
              <div className={`flex items-center gap-1 mt-0.5 ${msg.isMine ? "justify-end" : ""}`}>
                <span className={`text-[10px] ${msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatTime(msg.timestamp)}
                </span>
                {msg.isMine && (
                  msg.readAt ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                  ) : msg.id.startsWith("temp-") ? (
                    <Check className="w-3.5 h-3.5 text-primary-foreground/40" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/40" />
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator bubble */}
        {remoteIsTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="px-4 pb-1 flex flex-wrap gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInput((prev) => prev + emoji);
                setShowEmojis(false);
              }}
              className="text-xl hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-20 md:bottom-0 bg-card border-t border-border px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
