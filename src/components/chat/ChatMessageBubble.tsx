import { useState, useRef, useCallback } from "react";
import { Check, CheckCheck, Reply } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatMessage } from "@/pages/ChatPage";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isRemoteOnline?: boolean;
  replyToMessage?: ChatMessage | null;
  onReply?: (msg: ChatMessage) => void;
  onContextAction?: (msg: ChatMessage, position: { x: number; y: number }) => void;
  isEditing?: boolean;
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
  isEditing = false,
}: ChatMessageBubbleProps) {
  const isMine = msg.isMine;
  const isMobile = useIsMobile();
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const triggeredRef = useRef(false);
  const isSwipingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    triggeredRef.current = false;
    isSwipingRef.current = false;
    longPressTriggeredRef.current = false;

    // Long press detection
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

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || longPressTriggeredRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if moved
    if (Math.abs(deltaX) > 8 || deltaY > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (triggeredRef.current) return;

    // If vertical scroll is dominant, cancel swipe
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

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isSwipingRef.current = false;
    setSwipeX(0);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    onContextAction?.(msg, { x: e.clientX, y: e.clientY });
  }, [isMobile, onContextAction, msg]);

  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1);

  return (
    <div
      className={`group relative overflow-hidden ${isMine ? "flex justify-end" : "flex justify-start"}`}
      onContextMenu={handleContextMenu}
    >
      {/* Swipe reply indicator */}
      {isMobile && onReply && swipeX !== 0 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center ${
            isMine ? "left-2" : "right-2"
          }`}
          style={{ opacity: swipeProgress }}
        >
          <div className={`p-1.5 rounded-full bg-secondary ${swipeProgress >= 1 ? "scale-110" : ""} transition-transform`}>
            <Reply className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}
        style={{
          transform: swipeX !== 0 ? `translateX(${swipeX}px)` : undefined,
          transition: swipeX === 0 ? "transform 0.25s ease-out" : undefined,
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchCancel={isMobile ? handleTouchEnd : undefined}
      >
        {/* Reply button - desktop only, left side for received */}
        {!isMobile && !isMine && onReply && (
          <button
            onClick={() => onReply(msg)}
            className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        )}

        <div className={`max-w-[75%] ${isMine ? "order-1" : ""}`}>
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
            className={`px-3 py-1.5 inline-flex items-end gap-2 ${
              replyToMessage ? "rounded-b-2xl rounded-t-sm" : "rounded-2xl"
            } ${
              isMine
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            } ${isEditing ? "ring-2 ring-accent" : ""}`}
          >
            <p className="text-sm break-words">{msg.text}</p>
            <span className="flex items-center gap-0.5 flex-shrink-0 pb-0.5">
              {msg.editedAt && (
                <span className={`text-[9px] leading-none ${isMine ? "text-primary-foreground/40" : "text-muted-foreground/60"}`}>
                  edited
                </span>
              )}
              <span
                className={`text-[10px] leading-none ${
                  isMine ? "text-primary-foreground/50" : "text-muted-foreground"
                }`}
              >
                {formatTime(msg.timestamp)}
              </span>
              {getTickIcon(msg, isRemoteOnline)}
            </span>
          </div>
        </div>

        {/* Reply button - desktop only, right side for own */}
        {!isMobile && isMine && onReply && (
          <button
            onClick={() => onReply(msg)}
            className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-secondary order-0"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
