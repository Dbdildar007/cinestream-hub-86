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
  const signalChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const remoteUserIdRef = useRef<string | null>(null);

  // Get or create the shared signal channel for this user
  const getSignalChannel = useCallback(() => {
    if (!user) return null;
    if (signalChannelRef.current) return signalChannelRef.current;
    const channel = supabase.channel(`call-signal-${user.id}`);
    signalChannelRef.current = channel;
    return channel;
  }, [user]);

  // Send signaling data to remote user via their channel
  const sendSignal = useCallback(async (targetUserId: string, event: string, payload: any) => {
    const channelName = `call-signal-${targetUserId}`;
    // Use a temporary channel to send, subscribe first
    const ch = supabase.channel(channelName);
    await new Promise<void>((resolve) => {
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
      });
    });
    await ch.send({ type: "broadcast", event, payload });
    // Don't remove - let supabase manage cleanup
    setTimeout(() => supabase.removeChannel(ch), 2000);
  }, []);

  // Listen for incoming signals
  useEffect(() => {
    if (!user) return;

    const channel = getSignalChannel();
    if (!channel) return;

    channel
      .on("broadcast", { event: "call-offer" }, async (payload) => {
        const { fromUserId, fromDisplayName, offer } = payload.payload;
        remoteUserIdRef.current = fromUserId;
        setCallState((prev) => ({
          ...prev,
          status: "incoming",
          remoteUserId: fromUserId,
          remoteDisplayName: fromDisplayName,
        }));
        (window as any).__pendingOffer = offer;
        (window as any).__pendingFromUserId = fromUserId;
      })
      .on("broadcast", { event: "call-answer" }, async (payload) => {
        const { answer } = payload.payload;
        if (peerRef.current && peerRef.current.signalingState === "have-local-offer") {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          // Flush queued ICE candidates
          for (const candidate of iceCandidateQueue.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidateQueue.current = [];
        }
        setCallState((prev) => ({ ...prev, status: "connected" }));
      })
      .on("broadcast", { event: "ice-candidate" }, async (payload) => {
        const { candidate } = payload.payload;
        if (!candidate) return;
        if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue until remote description is set
          iceCandidateQueue.current.push(candidate);
        }
      })
      .on("broadcast", { event: "call-end" }, () => {
        cleanupCall();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      signalChannelRef.current = null;
    };
  }, [user, getSignalChannel]);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch {
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
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteUserId, "ice-candidate", { candidate: event.candidate.toJSON() });
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

    remoteUserIdRef.current = remoteUserId;
    iceCandidateQueue.current = [];

    setCallState((prev) => ({
      ...prev,
      status: "calling",
      remoteUserId,
      remoteDisplayName,
    }));

    // getUserMedia called directly in user gesture handler
    const stream = await getLocalStream();
    if (!stream) {
      setCallState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    const pc = createPeerConnection(remoteUserId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    await sendSignal(remoteUserId, "call-offer", {
      fromUserId: user.id,
      fromDisplayName: profile?.display_name || "User",
      offer: { type: offer.type, sdp: offer.sdp },
    });
  }, [user, sendSignal]);

  const acceptCall = useCallback(async () => {
    if (!user) return;
    const offer = (window as any).__pendingOffer;
    const fromUserId = (window as any).__pendingFromUserId;
    if (!offer || !fromUserId) return;

    iceCandidateQueue.current = [];
    remoteUserIdRef.current = fromUserId;

    // getUserMedia called directly in user gesture handler (accept button click)
    const stream = await getLocalStream();
    if (!stream) return;

    const pc = createPeerConnection(fromUserId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Flush any ICE candidates that arrived while setting up
    for (const candidate of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    iceCandidateQueue.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await sendSignal(fromUserId, "call-answer", {
      answer: { type: answer.type, sdp: answer.sdp },
    });

    setCallState((prev) => ({ ...prev, status: "connected" }));
    delete (window as any).__pendingOffer;
    delete (window as any).__pendingFromUserId;
  }, [user, sendSignal]);

  const declineCall = useCallback(() => {
    const fromUserId = (window as any).__pendingFromUserId;
    if (fromUserId) {
      sendSignal(fromUserId, "call-end", {});
    }
    cleanupCall();
  }, [sendSignal]);

  const endCall = useCallback(() => {
    if (remoteUserIdRef.current) {
      sendSignal(remoteUserIdRef.current, "call-end", {});
    }
    cleanupCall();
  }, [sendSignal]);

  const cleanupCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    remoteUserIdRef.current = null;
    iceCandidateQueue.current = [];
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
