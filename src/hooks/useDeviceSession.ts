import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo } from "@/utils/deviceInfo";

export function useDeviceSession(userId: string | undefined, onEvicted: () => void) {
  const deviceIdRef = useRef<string>("");
  const channelRef = useRef<any>(null);

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

  // Register this device session
  const registerDevice = useCallback(async (forceLogin = false): Promise<{ status: string; existing_device?: any }> => {
    if (!userId) return { status: "no_user" };

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
      p_user_id: userId,
      p_device_id: deviceId,
      p_device_info: deviceInfo,
      p_force_login: forceLogin,
    });

    if (error) {
      console.error("Device login RPC error:", error);
      return { status: "error" };
    }

    return data as { status: string; existing_device?: any };
  }, [userId, getDeviceId]);

  // Listen for eviction via realtime
  useEffect(() => {
    if (!userId) return;

    const deviceId = getDeviceId();

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
        async (payload) => {
          const newSession = payload.new?.active_session_id;
          // If session changed to something else (not us), verify with a fresh query
          if (newSession && newSession !== deviceId) {
            // Double-check from DB to avoid false evictions on WiFi reconnect
            const { data } = await supabase
              .from("profiles")
              .select("active_session_id")
              .eq("user_id", userId)
              .single();
            if (data && data.active_session_id && data.active_session_id !== deviceId) {
              onEvicted();
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, getDeviceId, onEvicted]);

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
