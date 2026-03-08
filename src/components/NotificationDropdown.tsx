import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, UserPlus, Film, Phone, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: (id: string) => void;
  onAction?: (notification: Notification) => void;
  onSendNotification?: (targetUserId: string, type: string, title: string, message: string, data?: Record<string, any>) => Promise<void>;
}

const typeIcons: Record<string, typeof Bell> = {
  friend_request: UserPlus,
  watch_party: Film,
  call: Phone,
  info: Bell,
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
  onClear,
  onAction,
  onSendNotification,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  const isFriendRequestActionable = (notif: Notification) => {
    return (
      notif.type === "friend_request" &&
      notif.title === "Friend Request" &&
      notif.data?.requester_id &&
      !handledIds.has(notif.id)
    );
  };

  const handleAcceptFromNotification = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const requesterId = notif.data?.requester_id as string;

    // Find the friendship record
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", requesterId)
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .single();

    if (!friendship) {
      toast.error("Request no longer available");
      setHandledIds(prev => new Set(prev).add(notif.id));
      return;
    }

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendship.id);

    if (!error) {
      // Get my display name and notify requester
      const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      if (onSendNotification) {
        await onSendNotification(
          requesterId,
          "friend_request",
          "Request Accepted ✅",
          `${myProfile?.display_name || "Someone"} accepted your friend request`
        );
      }
      onMarkAsRead(notif.id);
      setHandledIds(prev => new Set(prev).add(notif.id));
      toast.success("Friend request accepted!");
    }
  };

  const handleDeclineFromNotification = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const requesterId = notif.data?.requester_id as string;

    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", requesterId)
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .single();

    if (!friendship) {
      toast.error("Request no longer available");
      setHandledIds(prev => new Set(prev).add(notif.id));
      return;
    }

    const { error } = await supabase.from("friendships").delete().eq("id", friendship.id);
    if (!error) {
      const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      if (onSendNotification) {
        await onSendNotification(
          requesterId,
          "friend_request",
          "Request Declined",
          `${myProfile?.display_name || "Someone"} declined your friend request`
        );
      }
      onMarkAsRead(notif.id);
      setHandledIds(prev => new Set(prev).add(notif.id));
      toast("Friend request declined");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-secondary transition-colors relative"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-[340px] max-h-[460px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = typeIcons[notif.type] || Bell;
                    const actionable = isFriendRequestActionable(notif);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) onMarkAsRead(notif.id);
                          onAction?.(notif);
                        }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${
                          notif.is_read
                            ? "hover:bg-secondary/50"
                            : "bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notif.is_read ? "bg-secondary" : "bg-primary/20"
                        }`}>
                          <Icon className={`w-4 h-4 ${notif.is_read ? "text-muted-foreground" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${notif.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</p>

                          {/* Accept/Decline buttons for friend requests */}
                          {actionable && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => handleAcceptFromNotification(notif, e)}
                                className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-medium transition-colors"
                              >
                                <UserCheck className="w-3 h-3" /> Accept
                              </button>
                              <button
                                onClick={(e) => handleDeclineFromNotification(notif, e)}
                                className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-destructive/20 text-destructive text-[11px] font-medium transition-colors"
                              >
                                <X className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onClear(notif.id); }}
                          className="flex-shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
