import { useState, useRef, useCallback } from "react";
import { Check, CheckCheck, Undo2, Heart, MoreVertical, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatMessage } from "@/pages/ChatPage";

export interface MessageReaction {
  emoji: string;
  count: number;
  isMine: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isRemoteOnline?: boolean;
  replyToMessage?: ChatMessage | null;
  onReply?: (msg: ChatMessage) => void;
  onContextAction?: (msg: ChatMessage, position: { x: number; y: number }) => void;
  onReact?: (msg: ChatMessage, emoji: string) => void;
  isEditing?: boolean;
  reactions?: MessageReaction[];
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getTickIcon(msg: ChatMessage, isRemoteOnline: boolean) {
  if (!msg.isMine) return null;
  if (msg.readAt) return <CheckCheck className="w-3 h-3 text-sky-400" />;
  if (msg.id.startsWith("temp-")) return <Check className="w-3 h-3 text-primary-foreground/40" />;
  if (isRemoteOnline) return <CheckCheck className="w-3 h-3 text-primary-foreground/60" />;
  return <Check className="w-3 h-3 text-primary-foreground/70" />;
}

const SWIPE_THRESHOLD = 60;

export default function ChatMessageBubble({
  message: msg,
  isRemoteOnline = false,
  replyToMessage,
  onReply,
  onContextAction,
  onReact,
  isEditing = false,
  reactions = [],
}: ChatMessageBubbleProps) {
  const isMine = msg.isMine;
  const isMobile = useIsMobile();
  const [swipeX, setSwipeX] = useState(0);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const triggeredRef = useRef(false);
  const isSwipingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const lastTapRef = useRef(0);

  // Double-tap to heart
  const handleDoubleTap = useCallback(() => {
    if (!onReact) return;
    setHeartAnimation(true);
    onReact(msg, "❤️");
    setTimeout(() => setHeartAnimation(false), 800);
  }, [onReact, msg]);

  const handleClick = useCallback(() => {
    if (isMobile) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [isMobile, handleDoubleTap]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    triggeredRef.current = false;
    isSwipingRef.current = false;
    longPressTriggeredRef.current = false;

    if (onContextAction) {
      longPressTimerRef.current = setTimeout(() => {
        if (!isSwipingRef.current && touchStartRef.current) {
          longPressTriggeredRef.current = true;
          if (navigator.vibrate) navigator.vibrate(20);
          onContextAction(msg, { x: touchStartRef.current.x, y: touchStartRef.current.y });
        }
      }, 500);
    }
  }, [onContextAction, msg]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current && !longPressTriggeredRef.current && touchStartRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        handleDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
    setSwipeX(0);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || longPressTriggeredRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (Math.abs(deltaX) > 8 || deltaY > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (triggeredRef.current) return;

    if (!isSwipingRef.current && deltaY > 10 && Math.abs(deltaX) < deltaY) {
      touchStartRef.current = null;
      return;
    }

    if (!onReply) return;

    const direction = isMine ? -1 : 1;
    const raw = deltaX * direction;
    if (raw > 10) isSwipingRef.current = true;

    if (isSwipingRef.current) {
      const clamped = Math.min(Math.max(raw, 0), SWIPE_THRESHOLD + 20);
      setSwipeX(clamped * direction);
      if (clamped >= SWIPE_THRESHOLD && !triggeredRef.current) {
        triggeredRef.current = true;
        if (navigator.vibrate) navigator.vibrate(15);
        onReply(msg);
      }
    }
  }, [onReply, isMine, msg]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    onContextAction?.(msg, { x: e.clientX, y: e.clientY });
  }, [isMobile, onContextAction, msg]);

  // Desktop: click three-dot menu to open context menu
  const handleDesktopMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onContextAction?.(msg, { x: e.clientX, y: e.clientY });
  }, [onContextAction, msg]);

  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1);

  return (
    <div
      className={`relative py-0.5 ${isMine ? "flex justify-end pr-3" : "flex justify-start pl-1"}`}
      onContextMenu={handleContextMenu}
    >
      {/* Swipe reply indicator */}
      {isMobile && onReply && swipeX !== 0 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center ${isMine ? "left-2" : "right-2"}`}
          style={{ opacity: swipeProgress }}
        >
          <div className={`p-1.5 rounded-full bg-secondary ${swipeProgress >= 1 ? "scale-110" : ""} transition-transform`}>
            <Undo2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <div
        className={`group flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}
        style={{
          transform: swipeX !== 0 ? `translateX(${swipeX}px)` : undefined,
          transition: swipeX === 0 ? "transform 0.25s ease-out" : undefined,
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchCancel={isMobile ? handleTouchEnd : undefined}
      >
        {/* No left-side buttons for received messages anymore */}

        <div className={`max-w-[75%] relative group/bubble ${isMine ? "order-1" : ""}`}>
          {replyToMessage && (
            <div
              className={`mx-1 mb-0.5 px-2.5 py-1.5 rounded-t-xl text-[11px] border-l-2 ${
                isMine
                  ? "bg-primary/80 border-primary-foreground/30 text-primary-foreground/70"
                  : "bg-secondary/80 border-primary/50 text-muted-foreground"
              }`}
            >
              <p className="font-medium text-[10px] mb-0.5">
                {replyToMessage.isMine ? "You" : "Them"}
              </p>
              <p className="truncate">{replyToMessage.text}</p>
            </div>
          )}

          <div
            className={`px-3 py-1.5 relative ${
              replyToMessage ? "rounded-b-2xl rounded-t-sm" : "rounded-2xl"
            } ${
              isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            } ${isEditing ? "ring-2 ring-accent" : ""}`}
            onClick={handleClick}
          >
            <span className="text-sm break-words">{msg.text}</span>
            <span className="inline-flex items-center gap-0.5 float-right ml-2 mt-0.5 flex-shrink-0 whitespace-nowrap translate-y-[2px]">
              {msg.editedAt && (
                <span className={`text-[9px] leading-none ${isMine ? "text-primary-foreground/40" : "text-muted-foreground/60"}`}>
                  edited
                </span>
              )}
              <span className={`text-[10px] leading-none ${isMine ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                {formatTime(msg.timestamp)}
              </span>
              {getTickIcon(msg, isRemoteOnline)}
            </span>

            {/* Heart animation overlay */}
            <AnimatePresence>
              {heartAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-10 h-10 text-destructive fill-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reply quote icon at top-right corner of message bubble on hover */}
          {onReply && (
            <button
              onClick={() => onReply(msg)}
              className={`absolute -top-2 ${isMine ? "-right-2" : "-right-2"} opacity-0 group-hover/bubble:opacity-100 transition-opacity p-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent z-10 shadow-sm`}
            >
              <Quote className="w-3 h-3" />
            </button>
          )}

          {/* Reactions display */}
          {reactions.length > 0 && (
            <div className={`flex gap-0.5 mt-0.5 ${isMine ? "justify-end mr-1" : "justify-start ml-1"}`}>
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(msg, r.emoji)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] transition-colors ${
                    r.isMine
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-secondary border border-border"
                  }`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="text-muted-foreground text-[10px]">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: three-dot menu on hover */}
        {!isMobile && onContextAction && (
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "order-0" : ""}`}>
            <button
              onClick={handleDesktopMenuClick}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
