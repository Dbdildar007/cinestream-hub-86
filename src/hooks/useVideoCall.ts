import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type CallStatus = "idle" | "calling" | "incoming" | "connected" | "ended";

export interface CallState {
  status: CallStatus;
  remoteUserId: string | null;
  remoteDisplayName: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isMinimized: boolean;
}

export function useVideoCall() {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    remoteUserId: null,
    remoteDisplayName: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isCameraOff: false,
    isMinimized: false,
  });

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`call-signal-${user.id}`);
    channel.on("broadcast", { event: "call-offer" }, async (payload) => {
      const { fromUserId, fromDisplayName, offer } = payload.payload;
      setCallState((prev) => ({
        ...prev,
        status: "incoming",
        remoteUserId: fromUserId,
        remoteDisplayName: fromDisplayName,
      }));
      // Store the offer for when user accepts
      (window as any).__pendingOffer = offer;
      (window as any).__pendingFromUserId = fromUserId;
    });

    channel.on("broadcast", { event: "call-answer" }, async (payload) => {
      const { answer } = payload.payload;
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
      setCallState((prev) => ({ ...prev, status: "connected" }));
    });

    channel.on("broadcast", { event: "ice-candidate" }, async (payload) => {
      const { candidate } = payload.payload;
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    channel.on("broadcast", { event: "call-end" }, () => {
      cleanupCall();
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch {
      // Fallback to audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setCallState((prev) => ({ ...prev, localStream: stream, isCameraOff: true }));
        return stream;
      } catch {
        return null;
      }
    }
  };

  const createPeerConnection = (remoteUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const remoteChannel = supabase.channel(`call-signal-${remoteUserId}`);
        remoteChannel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      setCallState((prev) => ({ ...prev, remoteStream: event.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanupCall();
      }
    };

    peerRef.current = pc;
    return pc;
  };

  const startCall = useCallback(async (remoteUserId: string, remoteDisplayName: string) => {
    if (!user) return;

    setCallState((prev) => ({
      ...prev,
      status: "calling",
      remoteUserId,
      remoteDisplayName,
    }));

    const stream = await getLocalStream();
    if (!stream) {
      setCallState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    const pc = createPeerConnection(remoteUserId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Get current user display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const remoteChannel = supabase.channel(`call-signal-${remoteUserId}`);
    await remoteChannel.subscribe();
    remoteChannel.send({
      type: "broadcast",
      event: "call-offer",
      payload: {
        fromUserId: user.id,
        fromDisplayName: profile?.display_name || "User",
        offer: { type: offer.type, sdp: offer.sdp },
      },
    });
  }, [user]);

  const acceptCall = useCallback(async () => {
    if (!user) return;
    const offer = (window as any).__pendingOffer;
    const fromUserId = (window as any).__pendingFromUserId;
    if (!offer || !fromUserId) return;

    const stream = await getLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(fromUserId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const remoteChannel = supabase.channel(`call-signal-${fromUserId}`);
    await remoteChannel.subscribe();
    remoteChannel.send({
      type: "broadcast",
      event: "call-answer",
      payload: { answer: { type: answer.type, sdp: answer.sdp } },
    });

    setCallState((prev) => ({ ...prev, status: "connected" }));
    delete (window as any).__pendingOffer;
    delete (window as any).__pendingFromUserId;
  }, [user]);

  const declineCall = useCallback(() => {
    const fromUserId = (window as any).__pendingFromUserId;
    if (fromUserId) {
      const remoteChannel = supabase.channel(`call-signal-${fromUserId}`);
      remoteChannel.subscribe(() => {
        remoteChannel.send({ type: "broadcast", event: "call-end", payload: {} });
      });
    }
    cleanupCall();
  }, []);

  const endCall = useCallback(() => {
    if (callState.remoteUserId) {
      const remoteChannel = supabase.channel(`call-signal-${callState.remoteUserId}`);
      remoteChannel.subscribe(() => {
        remoteChannel.send({ type: "broadcast", event: "call-end", payload: {} });
      });
    }
    cleanupCall();
  }, [callState.remoteUserId]);

  const cleanupCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    setCallState({
      status: "idle",
      remoteUserId: null,
      remoteDisplayName: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      isMinimized: false,
    });
  };

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCallState((prev) => ({ ...prev, isCameraOff: !videoTrack.enabled }));
    }
  }, []);

  const toggleMinimize = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  return {
    callState,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleMinimize,
  };
}
