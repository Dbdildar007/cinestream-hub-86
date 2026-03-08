import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Pencil, Reply, Trash2, AlertTriangle } from "lucide-react";
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
  const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null);

  if (!message && !confirmDelete) return null;

  const handleDeleteClick = (msg: ChatMessage) => {
    onClose();
    setConfirmDelete(msg);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDelete(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const actions = message
    ? [
        { icon: Reply, label: "Reply", action: () => { onReply(message); onClose(); } },
        { icon: Copy, label: "Copy", action: () => { onCopy(message); onClose(); } },
        ...(message.isMine
          ? [
              { icon: Pencil, label: "Edit", action: () => { onEdit(message); onClose(); } },
              { icon: Trash2, label: "Delete", action: () => handleDeleteClick(message), destructive: true },
            ]
          : []),
      ]
    : [];

  return (
    <>
      {/* Context menu */}
      <AnimatePresence>
        {message && position && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
              onClick={onClose}
              onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
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

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={handleCancelDelete}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(320px,90vw)] rounded-2xl bg-card border border-border shadow-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Delete message?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                This action cannot be undone. The message will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
