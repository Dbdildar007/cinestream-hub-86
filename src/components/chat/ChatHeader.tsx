import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/utils/avatarUrl";

interface RemoteProfile {
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
}

interface ChatHeaderProps {
  remoteProfile: RemoteProfile | null;
  remoteIsTyping: boolean;
  onBack: () => void;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export default function ChatHeader({ remoteProfile, remoteIsTyping, onBack }: ChatHeaderProps) {
  const name = remoteProfile?.display_name || "Chat";
  const avatarUrl = getAvatarUrl(remoteProfile?.avatar_url, name);
  const isOnline = remoteProfile?.is_online ?? false;

  return (
    <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-2 md:py-3 flex items-center gap-3 flex-shrink-0">
      <button
        onClick={onBack}
        className="p-1.5 rounded-full hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="relative">
        <Avatar className="w-9 h-9">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator dot */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
            isOnline ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-foreground leading-tight">{name}</h2>
        {remoteIsTyping ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-primary"
          >
            typing...
          </motion.p>
        ) : (
          <p className={`text-[11px] ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
            {isOnline ? "Online" : formatLastSeen(remoteProfile?.last_seen ?? null)}
          </p>
        )}
      </div>
    </div>
  );
}
