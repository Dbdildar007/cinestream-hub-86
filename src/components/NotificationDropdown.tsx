import { useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Bell, CheckCheck, X, UserPlus, Film, Phone, UserCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Notification } from "@/hooks/useNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: (id: string) => void;
  onAction?: (notification: Notification) => void;
  onSendNotification?: (targetUserId: string, type: string, title: string, message: string, data?: Record<string, any>) => Promise<void>;
  isMobile?: boolean;
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

// Swipeable notification item for touch devices
function SwipeableNotificationItem({
  notif,
  onClear,
  onMarkAsRead,
  onAction,
  actionable,
  onAccept,
  onDecline,
  isTouchDevice,
}: {
  notif: Notification;
  onClear: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onAction?: (notification: Notification) => void;
  actionable: boolean;
  onAccept: (notif: Notification, e: React.MouseEvent) => void;
  onDecline: (notif: Notification) => void;
  isTouchDevice: boolean;
}) {
  const Icon = typeIcons[notif.type] || Bell;
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const deleteScale = useTransform(x, [-120, -60, 0], [1, 0.8, 0.6]);
  const [swiping, setSwiping] = useState(false);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setSwiping(false);
    if (info.offset.x < -100) {
      onClear(notif.id);
    }
  }, [notif.id, onClear]);

  const content = (
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium truncate ${notif.is_read ? "text-muted-foreground" : "text-foreground"}`}>
        {notif.title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.created_at)}</p>

      {actionable && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => onAccept(notif, e)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-medium transition-colors active:scale-95"
          >
            <UserCheck className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDecline(notif); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-destructive/20 text-destructive text-[11px] font-medium transition-colors active:scale-95"
          >
            <X className="w-3 h-3" /> Decline
          </button>
        </div>
      )}
    </div>
  );

  if (isTouchDevice) {
    return (
      <div className="relative overflow-hidden border-b border-border/50 last:border-0">
        {/* Delete background revealed on swipe */}
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-5 bg-destructive"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-0.5">
            <Trash2 className="w-4 h-4 text-destructive-foreground" />
            <span className="text-[9px] font-medium text-destructive-foreground">Delete</span>
          </motion.div>
        </motion.div>

        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -140, right: 0 }}
          dragElastic={{ left: 0.1, right: 0.5 }}
          style={{ x }}
          onDragStart={() => setSwiping(true)}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (swiping) return;
            if (!notif.is_read) onMarkAsRead(notif.id);
            onAction?.(notif);
          }}
          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors relative bg-card ${
            notif.is_read
              ? "active:bg-secondary/50"
              : "bg-primary/5 active:bg-primary/10"
          }`}
        >
          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
            notif.is_read ? "bg-secondary" : "bg-primary/20"
          }`}>
            <Icon className={`w-4 h-4 ${notif.is_read ? "text-muted-foreground" : "text-primary"}`} />
          </div>
          {content}
        </motion.div>
      </div>
    );
  }

  // Desktop: no swipe, show X button
  return (
    <div
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
      {content}
      <button
        onClick={(e) => { e.stopPropagation(); onClear(notif.id); }}
        className="flex-shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
  onClear,
  onAction,
  onSendNotification,
  isMobile,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const [declineTarget, setDeclineTarget] = useState<Notification | null>(null);
  const isMobileDevice = useIsMobile();
  const isTouchDevice = isMobile || isMobileDevice;

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

  const confirmDecline = async () => {
    if (!declineTarget || !user) return;
    const requesterId = declineTarget.data?.requester_id as string;

    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", requesterId)
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .single();

    if (!friendship) {
      toast.error("Request no longer available");
      setHandledIds(prev => new Set(prev).add(declineTarget.id));
      setDeclineTarget(null);
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
      onMarkAsRead(declineTarget.id);
      setHandledIds(prev => new Set(prev).add(declineTarget.id));
      toast("Friend request declined");
    }
    setDeclineTarget(null);
  };

  return (
    <>
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
                initial={{ opacity: 0, y: isMobile ? 10 : -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isMobile ? 10 : -10, scale: 0.95 }}
                className={`absolute z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden ${
                  isMobile
                    ? "bottom-full mb-2 right-1/2 translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-[380px] max-h-[70vh]"
                    : "right-0 top-full mt-2 w-[340px] max-h-[460px]"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                    {isTouchDevice && (
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Swipe hint for mobile */}
                {isTouchDevice && notifications.length > 0 && (
                  <div className="px-4 py-1.5 bg-muted/30 border-b border-border/30">
                    <p className="text-[10px] text-muted-foreground text-center">← Swipe left to dismiss</p>
                  </div>
                )}

                {/* Notifications list */}
                <div className={`overflow-y-auto ${isMobile ? "max-h-[55vh]" : "max-h-[400px]"}`}>
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                          layout
                        >
                          <SwipeableNotificationItem
                            notif={notif}
                            onClear={onClear}
                            onMarkAsRead={onMarkAsRead}
                            onAction={onAction}
                            actionable={isFriendRequestActionable(notif)}
                            onAccept={handleAcceptFromNotification}
                            onDecline={(n) => setDeclineTarget(n)}
                            isTouchDevice={isTouchDevice}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Decline confirmation dialog */}
      <AlertDialog open={!!declineTarget} onOpenChange={(open) => { if (!open) setDeclineTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline friend request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the request. The sender will be notified that you declined. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDecline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
