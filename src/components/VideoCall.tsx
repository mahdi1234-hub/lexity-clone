"use client";

import { useEffect, useState, useCallback } from "react";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  CallingState,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

interface VideoCallProps {
  roomId: string;
  userName: string;
  userImage?: string;
}

function CallUI() {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  if (callingState === CallingState.JOINING) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#C48C56" }}>
        <div style={{ textAlign: "center" }}>
          <svg style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{
          padding: "6px 16px",
          backgroundColor: "#2C2824",
          borderBottom: "1px solid #3D3530",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "rgba(242,239,234,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Video Call
          </span>
          <span style={{ fontSize: 11, color: "rgba(242,239,234,0.4)" }}>
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <SpeakerLayout />
        </div>
        <div style={{
          backgroundColor: "#2C2824",
          borderTop: "1px solid #3D3530",
          padding: "8px 0",
        }}>
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
}

export default function VideoCall({ roomId, userName, userImage }: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [call, setCall] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [joined, setJoined] = useState(false);

  const initCall = useCallback(async () => {
    try {
      const res = await fetch("/api/stream-token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get video token");
      const data = await res.json();

      const videoClient = new StreamVideoClient({
        apiKey: data.apiKey,
        user: {
          id: data.userId,
          name: data.userName || userName,
          image: data.userImage || userImage || "",
        },
        token: data.token,
      });

      const videoCall = videoClient.call("default", `collab-${roomId}`);
      await videoCall.join({ create: true });

      setClient(videoClient);
      setCall(videoCall);
      setJoined(true);
    } catch (err) {
      console.error("Video call error:", err);
      setError("Failed to join video call. Check your Stream.io configuration.");
    }
  }, [roomId, userName, userImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (call) {
        call.leave().catch(() => {});
      }
      if (client) {
        client.disconnectUser().catch(() => {});
      }
    };
  }, [call, client]);

  if (error) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "#1A1714",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(198,40,40,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ width: 24, height: 24, color: "#C62828" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ fontSize: 13, color: "rgba(242,239,234,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: "center", maxWidth: 300 }}>
          {error}
        </p>
        <button
          onClick={() => { setError(""); initCall(); }}
          style={{
            padding: "8px 20px", fontSize: 12, borderRadius: 8, border: "none",
            cursor: "pointer", backgroundColor: "#C48C56", color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "#1A1714",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(196,140,86,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ width: 28, height: 28, color: "#C48C56" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.10 5.88C16.29 6.93 17 8.38 17 10c0 1.62-.71 3.07-1.90 4.12M18.72 2.26C20.78 4.02 22 6.84 22 10c0 3.16-1.22 5.98-3.28 7.74" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 10c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7-7-3.13-7-7z" />
            <path d="M9 10h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p style={{ fontSize: 15, color: "rgba(242,239,234,0.8)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
          Ready to join the call?
        </p>
        <p style={{ fontSize: 12, color: "rgba(242,239,234,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Room: {roomId}
        </p>
        <button
          onClick={initCall}
          style={{
            padding: "12px 32px", fontSize: 14, borderRadius: 12, border: "none",
            cursor: "pointer", backgroundColor: "#C48C56", color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Join Video Call
        </button>
      </div>
    );
  }

  if (!client || !call) return null;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#1A1714" }}>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallUI />
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
