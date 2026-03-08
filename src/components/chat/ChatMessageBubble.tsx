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
  if (msg.readAt) return <CheckCheck className="w-3 h-3 text-sky-400" />;
  if (msg.id.startsWith("temp-")) return <Check className="w-3 h-3 text-primary-foreground/40" />;
  if (isRemoteOnline) return <CheckCheck className="w-3 h-3 text-primary-foreground/60" />;
  return <Check className="w-3 h-3 text-primary-foreground/70" />;
}

export default function ChatMessageBubble({
  message: msg,
  isRemoteOnline = false,
}: ChatMessageBubbleProps) {
  const isMine = msg.isMine;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-3 py-1.5 rounded-2xl inline-flex items-end gap-2 ${
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
  );
}
