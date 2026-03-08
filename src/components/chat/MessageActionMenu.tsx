import { AnimatePresence, motion } from "framer-motion";
import { Copy, Pencil, Reply, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/pages/ChatPage";

interface MessageActionMenuProps {
  message: ChatMessage | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onCopy: (msg: ChatMessage) => void;
}

export default function MessageActionMenu({
  message,
  position,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onCopy,
}: MessageActionMenuProps) {
  if (!message || !position) return null;

  const actions = [
    { icon: Reply, label: "Reply", action: () => { onReply(message); onClose(); } },
    { icon: Copy, label: "Copy", action: () => { onCopy(message); onClose(); } },
    ...(message.isMine
      ? [
          { icon: Pencil, label: "Edit", action: () => { onEdit(message); onClose(); } },
          { icon: Trash2, label: "Delete", action: () => { onDelete(message); onClose(); }, destructive: true },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      {message && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
          />
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 min-w-[140px] rounded-xl bg-card border border-border shadow-lg overflow-hidden"
            style={{
              left: Math.min(position.x, window.innerWidth - 160),
              top: Math.min(position.y, window.innerHeight - actions.length * 44 - 16),
            }}
          >
            {actions.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary ${
                  (item as any).destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground"
                } ${i > 0 ? "border-t border-border/50" : ""}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
