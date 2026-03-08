import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import ChatLoadingSkeleton from "@/components/chat/ChatLoadingSkeleton";
import ChatTypingIndicator from "@/components/chat/ChatTypingIndicator";

export interface ChatMessage {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: string;
  readAt: string | null;
}

interface RemoteProfile {
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
}

const EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "😱", "🎬", "🍿", "👋", "😊", "🎉", "💯"];

export default function ChatPage() {
  const { userId: remoteUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [remoteProfile, setRemoteProfile] = useState<RemoteProfile | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sendLockRef = useRef(false);

  const mapMessage = useCallback((m: any, userId: string): ChatMessage => ({
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
      .select("display_name, avatar_url, is_online, last_seen")
      .eq("user_id", remoteUserId)
      .single()
      .then(({ data }) => {
        if (data) setRemoteProfile(data);
      });
  }, [remoteUserId]);

  // Mark unread messages as read
  const markAsRead = useCallback(async () => {
    if (!user || !remoteUserId) return;
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("sender_id", remoteUserId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  }, [user, remoteUserId]);

  // Load messages and subscribe
  useEffect(() => {
    if (!user || !remoteUserId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${remoteUserId}),and(sender_id.eq.${remoteUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data.map((m: any) => mapMessage(m, user.id)));
      }
      // Small delay for smooth skeleton → messages transition
      setTimeout(() => setIsLoading(false), 400);
      markAsRead();
    };
    loadMessages();

    const channelName = `chat-${[user.id, remoteUserId].sort().join("-")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as any;
          if (
            (m.sender_id === user.id && m.receiver_id === remoteUserId) ||
            (m.sender_id === remoteUserId && m.receiver_id === user.id)
          ) {
            // Ignore our own realtime insert to avoid temp+persisted double-render.
            // Own messages are reconciled by insert response + polling.
            if (m.sender_id === user.id) return;

            setMessages((prev) => {
              if (prev.some((p) => p.id === m.id)) return prev;
              return [...prev, mapMessage(m, user.id)];
            });
            markAsRead();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === m.id ? { ...msg, readAt: m.read_at } : msg
            )
          );
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === remoteUserId) {
          setRemoteIsTyping(true);
          if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
          remoteTypingTimeoutRef.current = setTimeout(() => setRemoteIsTyping(false), 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("chat_messages")
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

  // Scroll to bottom on new messages + handle keyboard resize on mobile
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, remoteIsTyping, scrollToBottom]);

  // Handle mobile keyboard: adjust view when virtual keyboard opens
  useEffect(() => {
    const handleResize = () => {
      // When keyboard opens, viewport shrinks — scroll to latest message
      setTimeout(scrollToBottom, 100);
    };

    if (typeof visualViewport !== "undefined" && visualViewport) {
      visualViewport.addEventListener("resize", handleResize);
      return () => visualViewport.removeEventListener("resize", handleResize);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scrollToBottom]);

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
    if (!input.trim() || !user || !remoteUserId || sendLockRef.current) return;

    const text = input.trim();
    const tempId = `temp-${Date.now()}`;
    sendLockRef.current = true;
    setIsSending(true);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, isMine: true, timestamp: new Date().toISOString(), readAt: null },
    ]);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          sender_id: user.id,
          receiver_id: remoteUserId,
          message: text,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => {
          const mapped = mapMessage(data as any, user.id);
          const alreadyExists = prev.some((m) => m.id === mapped.id);
          const replaced = prev.map((m) => (m.id === tempId ? mapped : m));
          return alreadyExists ? replaced.filter((m) => m.id !== tempId) : replaced;
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      sendLockRef.current = false;
      setIsSending(false);
    }
  };

  if (!user) {
    navigate("/auth", { replace: true });
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] bg-background flex flex-col pt-0 md:pt-20 pb-0"
    >
      <ChatHeader
        remoteProfile={remoteProfile}
        remoteIsTyping={remoteIsTyping}
        onBack={() => navigate("/friends")}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <ChatLoadingSkeleton />
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <p className="text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={true}>
            {messages.map((msg, index) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                index={index}
              />
            ))}
          </AnimatePresence>
        )}

        {remoteIsTyping && <ChatTypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-1 flex flex-wrap gap-2 overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-2 md:py-3 pb-[env(safe-area-inset-bottom,8px)] md:pb-3 flex items-center gap-2">
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isSending}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
