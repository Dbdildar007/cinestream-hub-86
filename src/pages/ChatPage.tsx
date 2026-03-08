import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, X, Pencil } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageBubble, { type MessageReaction } from "@/components/chat/ChatMessageBubble";
import ChatLoadingSkeleton from "@/components/chat/ChatLoadingSkeleton";
import ChatTypingIndicator from "@/components/chat/ChatTypingIndicator";
import MessageActionMenu from "@/components/chat/MessageActionMenu";

export interface ChatMessage {
  id: string;
  stableKey: string;
  text: string;
  isMine: boolean;
  timestamp: string;
  readAt: string | null;
  replyToId: string | null;
  editedAt?: string | null;
}

interface RawReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ message: ChatMessage; position: { x: number; y: number } } | null>(null);
  const [reactions, setReactions] = useState<RawReaction[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sendLockRef = useRef(false);

  const mapMessage = useCallback((m: any, userId: string): ChatMessage => ({
    id: m.id,
    stableKey: m.id,
    text: m.message,
    isMine: m.sender_id === userId,
    timestamp: m.created_at,
    readAt: m.read_at || null,
    replyToId: m.reply_to_id || null,
    editedAt: m.edited_at || null,
  }), []);

  // Load remote profile
  useEffect(() => {
    if (!remoteUserId) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, is_online, last_seen")
      .eq("user_id", remoteUserId)
      .single()
      .then(({ data }) => { if (data) setRemoteProfile(data); });
  }, [remoteUserId]);

  const markAsRead = useCallback(async () => {
    if (!user || !remoteUserId) return;
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("sender_id", remoteUserId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  }, [user, remoteUserId]);

  // Load messages, reactions, and subscribe
  useEffect(() => {
    if (!user || !remoteUserId) return;

    const msgFilter = `and(sender_id.eq.${user.id},receiver_id.eq.${remoteUserId}),and(sender_id.eq.${remoteUserId},receiver_id.eq.${user.id})`;

    const loadMessages = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(msgFilter)
        .order("created_at", { ascending: true })
        .limit(200);

      if (data) {
        const mapped = data.map((m: any) => mapMessage(m, user.id));
        setMessages(mapped);

        // Load reactions for these messages
        const ids = data.map((m: any) => m.id);
        if (ids.length > 0) {
          const { data: rxns } = await supabase
            .from("message_reactions")
            .select("id, message_id, user_id, emoji")
            .in("message_id", ids);
          if (rxns) setReactions(rxns as RawReaction[]);
        }
      }
      setIsLoading(false);
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "instant" });
        setInitialLoadDone(true);
      });
      markAsRead();
    };
    loadMessages();

    const channelName = `chat-${[user.id, remoteUserId].sort().join("-")}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as any;
        if ((m.sender_id === user.id && m.receiver_id === remoteUserId) ||
            (m.sender_id === remoteUserId && m.receiver_id === user.id)) {
          if (m.sender_id === user.id) return;
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, mapMessage(m, user.id)];
          });
          markAsRead();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as any;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === m.id ? { ...msg, text: m.message, readAt: m.read_at, editedAt: m.edited_at } : msg
          )
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const old = payload.old as any;
        if (old?.id) {
          setMessages((prev) => prev.filter((msg) => msg.id !== old.id));
          setReactions((prev) => prev.filter((r) => r.message_id !== old.id));
        }
      })
      // Reactions realtime
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" }, (payload) => {
        const r = payload.new as any;
        setReactions((prev) => {
          if (prev.some((p) => p.id === r.id)) return prev;
          return [...prev, { id: r.id, message_id: r.message_id, user_id: r.user_id, emoji: r.emoji }];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" }, (payload) => {
        const old = payload.old as any;
        if (old?.id) setReactions((prev) => prev.filter((r) => r.id !== old.id));
      })
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
      if (sendLockRef.current) return;
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(msgFilter)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id.startsWith("temp-"))) return prev;
          return data.map((m: any) => mapMessage(m, user.id));
        });
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      channelRef.current = null;
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
    };
  }, [user, remoteUserId, mapMessage, markAsRead]);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((instant = false) => {
    chatEndRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
  }, []);

  useEffect(() => {
    if (initialLoadDone && isNearBottom()) scrollToBottom();
  }, [messages, remoteIsTyping, scrollToBottom, initialLoadDone, isNearBottom]);

  useEffect(() => {
    const vv = typeof visualViewport !== "undefined" ? visualViewport : null;
    if (!vv) return;
    const handleResize = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setKeyboardInset(inset);
      setTimeout(() => scrollToBottom(true), 50);
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    return () => { vv.removeEventListener("resize", handleResize); vv.removeEventListener("scroll", handleResize); };
  }, [scrollToBottom]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    broadcastTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !remoteUserId || sendLockRef.current) return;

    if (editingMessage) {
      const newText = input.trim();
      if (newText === editingMessage.text) { setEditingMessage(null); setInput(""); return; }
      sendLockRef.current = true;
      setIsSending(true);
      try {
        const { error } = await supabase
          .from("chat_messages")
          .update({ message: newText, edited_at: new Date().toISOString() } as any)
          .eq("id", editingMessage.id)
          .eq("sender_id", user.id);
        if (error) throw error;
        setMessages((prev) =>
          prev.map((m) => m.id === editingMessage.id ? { ...m, text: newText, editedAt: new Date().toISOString() } : m)
        );
        toast.success("Message edited");
      } catch {
        toast.error("Failed to edit message");
      } finally {
        sendLockRef.current = false;
        setIsSending(false);
        setEditingMessage(null);
        setInput("");
      }
      return;
    }

    const text = input.trim();
    const tempId = `temp-${Date.now()}`;
    sendLockRef.current = true;
    setIsSending(true);
    setInput("");
    const replyId = replyTo?.id.startsWith("temp-") ? null : replyTo?.id || null;
    setReplyTo(null);
    setMessages((prev) => [
      ...prev,
      { id: tempId, stableKey: tempId, text, isMine: true, timestamp: new Date().toISOString(), readAt: null, replyToId: replyId },
    ]);

    try {
      const insertPayload: any = { sender_id: user.id, receiver_id: remoteUserId, message: text };
      if (replyId) insertPayload.reply_to_id = replyId;
      const { data, error } = await supabase.from("chat_messages").insert(insertPayload).select().single();
      if (error) throw error;
      if (data) {
        setMessages((prev) => {
          const mapped = mapMessage(data as any, user.id);
          mapped.stableKey = tempId;
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

  const handleDelete = async (msg: ChatMessage) => {
    if (!user) return;
    // Optimistically remove
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    try {
      const { error } = await supabase.from("chat_messages").delete().eq("id", msg.id).eq("sender_id", user.id);
      if (error) throw error;
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleEdit = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setReplyTo(null);
    setInput(msg.text);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    toast.success("Copied to clipboard");
  };

  const handleReact = async (msg: ChatMessage, emoji: string) => {
    if (!user) return;
    // Check if already reacted with this emoji
    const existing = reactions.find((r) => r.message_id === msg.id && r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      // Toggle off
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      // Add reaction optimistically
      const tempId = `temp-rxn-${Date.now()}`;
      setReactions((prev) => [...prev, { id: tempId, message_id: msg.id, user_id: user.id, emoji }]);
      const { data, error } = await supabase
        .from("message_reactions")
        .insert({ message_id: msg.id, user_id: user.id, emoji } as any)
        .select()
        .single();
      if (data) {
        setReactions((prev) => prev.map((r) => r.id === tempId ? { ...r, id: (data as any).id } : r));
      } else if (error) {
        setReactions((prev) => prev.filter((r) => r.id !== tempId));
      }
    }
  };

  const cancelEdit = () => { setEditingMessage(null); setInput(""); };

  // Build reactions map for each message
  const getReactionsForMessage = useCallback((msgId: string): MessageReaction[] => {
    if (!user) return [];
    const msgReactions = reactions.filter((r) => r.message_id === msgId);
    const grouped: Record<string, { count: number; isMine: boolean }> = {};
    for (const r of msgReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, isMine: false };
      grouped[r.emoji].count++;
      if (r.user_id === user.id) grouped[r.emoji].isMine = true;
    }
    return Object.entries(grouped).map(([emoji, data]) => ({ emoji, ...data }));
  }, [reactions, user]);

  if (!user) {
    navigate("/auth", { replace: true });
    return null;
  }

  return (
    <div id="chat-container" className="h-[100dvh] bg-background flex flex-col pt-0 md:pt-20 pb-0">
      <ChatHeader
        remoteProfile={remoteProfile}
        remoteIsTyping={remoteIsTyping}
        onBack={() => navigate("/friends")}
      />

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
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
          <>
            {messages.map((msg) => {
              const replyMsg = msg.replyToId ? messages.find((m) => m.id === msg.replyToId) || null : null;
              return (
                <ChatMessageBubble
                  key={msg.stableKey}
                  message={msg}
                  isRemoteOnline={remoteProfile?.is_online ?? false}
                  replyToMessage={replyMsg}
                  onReply={(m) => setReplyTo(m)}
                  onContextAction={(m, pos) => setContextMenu({ message: m, position: pos })}
                  onReact={handleReact}
                  isEditing={editingMessage?.id === msg.id}
                  reactions={getReactionsForMessage(msg.id)}
                />
              );
            })}
          </>
        )}
        {remoteIsTyping && <ChatTypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      <MessageActionMenu
        message={contextMenu?.message ?? null}
        position={contextMenu?.position ?? null}
        onClose={() => setContextMenu(null)}
        onReply={(m) => setReplyTo(m)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
      />

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
                onClick={() => { setInput((prev) => prev + emoji); setShowEmojis(false); }}
                className="text-xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {editingMessage && (
        <div className="bg-card border-t border-border px-4 py-2 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-accent flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Editing message
            </p>
            <p className="text-xs text-muted-foreground truncate">{editingMessage.text}</p>
          </div>
          <button onClick={cancelEdit} className="p-1 rounded-full hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {replyTo && !editingMessage && (
        <div className="bg-card border-t border-border px-4 py-2 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-primary">
              {replyTo.isMine ? "You" : remoteProfile?.display_name || "Them"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className="bg-card border-t border-border px-4 py-2 md:py-3 flex items-center gap-2 mb-2 md:mb-4"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 12px) + ${keyboardInset}px)` }}
      >
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setTimeout(() => scrollToBottom(true), 80)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.repeat) { e.preventDefault(); sendMessage(); }
            if (e.key === "Escape" && editingMessage) cancelEdit();
          }}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isSending}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {editingMessage ? <Pencil className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
