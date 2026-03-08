import { Check, CheckCheck, Reply, X } from "lucide-react";
import type { ChatMessage } from "@/pages/ChatPage";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isRemoteOnline?: boolean;
  replyToMessage?: ChatMessage | null;
  onReply?: (msg: ChatMessage) => void;
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

export default function ChatMessageBubble({
  message: msg,
  isRemoteOnline = false,
  replyToMessage,
  onReply,
}: ChatMessageBubbleProps) {
  const isMine = msg.isMine;

  return (
    <div className={`group flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
      {/* Reply button - left side for received messages */}
      {!isMine && onReply && (
        <button
          onClick={() => onReply(msg)}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}

      <div className={`max-w-[75%] ${isMine ? "order-1" : ""}`}>
        {/* Reply preview */}
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
          }`}
        >
          <p className="text-sm break-words">{msg.text}</p>
          <span className="flex items-center gap-0.5 flex-shrink-0 pb-0.5">
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

      {/* Reply button - right side for own messages */}
      {isMine && onReply && (
        <button
          onClick={() => onReply(msg)}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-secondary order-0"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
