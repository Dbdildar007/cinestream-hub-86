import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo } from "@/utils/deviceInfo";

export function useDeviceSession(userId: string | undefined, onEvicted: () => void) {
  const deviceIdRef = useRef<string>("");
  const channelRef = useRef<any>(null);
  const evictedRef = useRef(false);
  const onEvictedRef = useRef(onEvicted);
  const registeredRef = useRef(false);
  onEvictedRef.current = onEvicted;

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

      const result = data as { status: string; existing_device?: any };
      
      // Only mark as registered if this device is now the active one
      if (result.status === "ok") {
        registeredRef.current = true;
      }

      return result;
    },
    [userId, getDeviceId]
  );

  // Realtime + polling eviction listener
  useEffect(() => {
    if (!userId) {
      registeredRef.current = false;
      return;
    }

    evictedRef.current = false;
    const deviceId = getDeviceId();

    // Set online status on mount
    supabase
      .from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() } as any)
      .eq("user_id", userId)
      .then();

    // On mount, check if this device is already the active session
    const initCheck = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("active_session_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.active_session_id === deviceId) {
        registeredRef.current = true;
      }
    };
    void initCheck();

    // Set offline on visibility hidden, online on visible
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() } as any)
          .eq("user_id", userId)
          .then();
      }
    };

    const checkSession = async () => {
      if (evictedRef.current) return;

      const { data } = await supabase
        .from("profiles")
        .select("active_session_id")
        .eq("user_id", userId)
        .maybeSingle();

      const activeSessionId = data?.active_session_id ?? null;

      // If this hook instance missed initial registration timing, auto-sync it.
      if (!registeredRef.current) {
        if (activeSessionId && activeSessionId === deviceId) {
          registeredRef.current = true;
        }
        return;
      }

      if (activeSessionId && activeSessionId !== deviceId && !evictedRef.current) {
        evictedRef.current = true;
        registeredRef.current = false;
        onEvictedRef.current();
      }
    };

    channelRef.current = supabase
      .channel(`device-eviction-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
        () => { void checkSession(); }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") void checkSession();
      });

    const pollId = window.setInterval(checkSession, 3000);

    // Heartbeat: update updated_at every 10 min to keep session "alive"
    const heartbeatId = window.setInterval(async () => {
      if (evictedRef.current || !registeredRef.current) return;
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("user_id", userId);
    }, 10 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
        supabase
          .from("profiles")
          .update({ is_online: true, last_seen: new Date().toISOString() } as any)
          .eq("user_id", userId)
          .then();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(pollId);
      window.clearInterval(heartbeatId);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      // Set offline on unmount
      supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() } as any)
        .eq("user_id", userId)
        .then();
    };
  }, [userId, getDeviceId]);

  const clearSession = useCallback(async () => {
    if (!userId) return;
    registeredRef.current = false;
    await supabase
      .from("profiles")
      .update({ active_session_id: null, is_online: false } as any)
      .eq("user_id", userId);
  }, [userId]);

  return { registerDevice, clearSession, getDeviceId };
}
