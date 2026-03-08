import { Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/pages/ChatPage";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isRemoteOnline?: boolean;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getTickIcon(msg: ChatMessage, isRemoteOnline: boolean) {
  if (!msg.isMine) return null;

  // Read → blue double tick
  if (msg.readAt) {
    return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
  }

  // Pending (temp) → single grey tick
  if (msg.id.startsWith("temp-")) {
    return <Check className="w-3.5 h-3.5 text-primary-foreground/40" />;
  }

  // Delivered & remote online → double tick (grey)
  if (isRemoteOnline) {
    return <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/60" />;
  }

  // Sent but remote offline → single tick
  return <Check className="w-3.5 h-3.5 text-primary-foreground/70" />;
}

export default function ChatMessageBubble({
  message: msg,
  isRemoteOnline = false,
}: ChatMessageBubbleProps) {
  const isMine = msg.isMine;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[75%] ${isMine ? "pr-2" : "pl-2"}`}>
        {/* Tail / arrow */}
        {isMine ? (
          <svg
            className="absolute -right-1.5 top-0 text-primary"
            width="12" height="16" viewBox="0 0 12 16" fill="currentColor"
          >
            <path d="M0 0 C4 0 8 2 10 6 C11 8 12 12 12 16 C8 12 4 8 0 8 Z" />
          </svg>
        ) : (
          <svg
            className="absolute -left-1.5 top-0 text-secondary"
            width="12" height="16" viewBox="0 0 12 16" fill="currentColor"
          >
            <path d="M12 0 C8 0 4 2 2 6 C1 8 0 12 0 16 C4 12 8 8 12 8 Z" />
          </svg>
        )}

        <div
          className={`px-3 py-2 rounded-2xl ${
            isMine
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-secondary text-secondary-foreground rounded-tl-none"
          }`}
        >
          <p className="text-sm break-words">{msg.text}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
            <span
              className={`text-[10px] ${
                isMine ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}
            >
              {formatTime(msg.timestamp)}
            </span>
            {getTickIcon(msg, isRemoteOnline)}
          </div>
        </div>
      </div>
    </div>
  );
}
