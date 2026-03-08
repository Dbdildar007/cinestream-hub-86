import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/pages/ChatPage";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  index: number;
  receiverOnline?: boolean;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessageBubble({
  message: msg,
  index,
  receiverOnline = false,
}: ChatMessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.6),
        ease: "easeOut",
      }}
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
          <span
            className={`text-[10px] ${
              msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"
            }`}
          >
            {formatTime(msg.timestamp)}
          </span>
          {msg.isMine &&
            (msg.readAt ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
            ) : msg.id.startsWith("temp-") ? (
              <Check className="w-3.5 h-3.5 text-primary-foreground/40" />
            ) : receiverOnline ? (
              <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/60" />
            ) : (
              <Check className="w-3.5 h-3.5 text-primary-foreground/60" />
            ))}
        </div>
      </div>
    </motion.div>
  );
}
