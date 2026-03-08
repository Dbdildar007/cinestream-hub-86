import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
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
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    const channel = supabase
      .channel(`chat-page-${[user.id, remoteUserId].sort().join("-")}`)
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
  }, [user, remoteUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !remoteUserId) return;
    const text = input.trim();
    setInput("");
    await supabase.from("call_messages").insert({
      sender_id: user.id,
      receiver_id: remoteUserId,
      message: text,
    } as any);
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
        <h2 className="text-sm font-semibold text-foreground">{remoteName || "Chat"}</h2>
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
              <p className={`text-[10px] mt-0.5 ${msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
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
          onChange={(e) => setInput(e.target.value)}
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
