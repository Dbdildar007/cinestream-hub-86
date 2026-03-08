import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo } from "@/utils/deviceInfo";

export function useDeviceSession(userId: string | undefined, onEvicted: () => void) {
  const deviceIdRef = useRef<string>("");
  const channelRef = useRef<any>(null);
  const hasEvictedRef = useRef(false);

  // Get or create persistent device ID
  const getDeviceId = useCallback(() => {
    if (deviceIdRef.current) return deviceIdRef.current;
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    deviceIdRef.current = id;
    return id;
  }, []);

  const triggerEviction = useCallback(() => {
    if (hasEvictedRef.current) return;
    hasEvictedRef.current = true;
    onEvicted();
  }, [onEvicted]);

  const verifyActiveSession = useCallback(
    async (targetUserId?: string) => {
      const effectiveUserId = targetUserId ?? userId;
      if (!effectiveUserId) return;

      const deviceId = getDeviceId();
      const { data, error } = await supabase
        .from("profiles")
        .select("active_session_id")
        .eq("user_id", effectiveUserId)
        .maybeSingle();

      if (error || !data?.active_session_id) return;
      if (data.active_session_id !== deviceId) {
        triggerEviction();
      }
    },
    [userId, getDeviceId, triggerEviction]
  );

  const registerDevice = useCallback(
    async (
      forceLogin = false,
      userIdOverride?: string
    ): Promise<{ status: string; existing_device?: any }> => {
      const targetUserId = userIdOverride ?? userId;
      if (!targetUserId) return { status: "no_user" };

      const deviceId = getDeviceId();
      const info = await getDeviceInfo();

      const deviceInfo = {
        device: /android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop",
        browser: info.browser,
        os: info.deviceName,
        ip: info.ip,
        last_login: new Date().toLocaleString(),
      };

      const { data, error } = await (supabase.rpc as any)("handle_single_device_login", {
        p_user_id: targetUserId,
        p_device_id: deviceId,
        p_device_info: deviceInfo,
        p_force_login: forceLogin,
      });

      if (error) {
        console.error("Device login RPC error:", error);
        return { status: "error" };
      }

      return data as { status: string; existing_device?: any };
    },
    [userId, getDeviceId]
  );

  // Listen for eviction via realtime + polling fallback
  useEffect(() => {
    if (!userId) return;

    hasEvictedRef.current = false;

    channelRef.current = supabase
      .channel(`device-eviction-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await verifyActiveSession(userId);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void verifyActiveSession(userId);
        }
      });

    const pollId = window.setInterval(() => {
      void verifyActiveSession(userId);
    }, 3000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void verifyActiveSession(userId);
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, verifyActiveSession]);

  // Clear session on logout
  const clearSession = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ active_session_id: null, is_online: false } as any)
      .eq("user_id", userId);
  }, [userId]);

  return { registerDevice, clearSession, getDeviceId };
}
