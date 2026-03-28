"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { RoomProvider } from "../../../liveblocks.config";
import dynamic from "next/dynamic";

const CollaborativeWhiteboard = dynamic(
  () => import("@/components/CollaborativeWhiteboard"),
  { ssr: false }
);

const CollaborativeEditor = dynamic(
  () => import("@/components/CollaborativeEditor"),
  { ssr: false }
);

const VideoCall = dynamic(
  () => import("@/components/VideoCall"),
  { ssr: false }
);

type TabType = "whiteboard" | "document" | "video";

function CollaborateContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string>("");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("whiteboard");
  // Use a ref to track if the room was already set to prevent re-renders
  const roomInitialized = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Only set roomId once from URL params
  useEffect(() => {
    if (roomInitialized.current) return;
    const room = searchParams.get("room");
    if (room) {
      setRoomId(room);
      roomInitialized.current = true;
    }
  }, [searchParams]);

  const createRoom = () => {
    const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setRoomId(newRoomId);
    roomInitialized.current = true;
    // Use replaceState to avoid triggering re-renders from URL changes
    window.history.replaceState(null, "", `/collaborate?room=${newRoomId}`);
  };

  const joinRoom = () => {
    if (!joinRoomInput.trim()) return;
    const id = joinRoomInput.trim();
    setRoomId(id);
    roomInitialized.current = true;
    window.history.replaceState(null, "", `/collaborate?room=${id}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#1A1714] flex items-center justify-center">
        <div className="relative inline-flex text-[#C48C56]">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  // Show room selection if no room is selected
  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#1A1714] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-light text-[#F2EFEA] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Real-Time Collaboration
            </h1>
            <p
              className="text-sm text-[#F2EFEA]/40"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Whiteboard, document editor, video calls, and more
            </p>
          </div>

          {/* Create room */}
          <div className="bg-[#2C2824] rounded-2xl border border-[#3D3530] p-6 mb-4">
            <h2 className="text-sm font-medium text-[#F2EFEA]/80 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Create a New Room
            </h2>
            <p className="text-xs text-[#F2EFEA]/30 mb-4">
              Start a fresh collaborative workspace with whiteboard, document editor, and video call.
            </p>
            <button
              onClick={createRoom}
              className="w-full bg-[#C48C56] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#C48C56]/80 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create Room
            </button>
          </div>

          {/* Join room */}
          <div className="bg-[#2C2824] rounded-2xl border border-[#3D3530] p-6 mb-6">
            <h2 className="text-sm font-medium text-[#F2EFEA]/80 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Join an Existing Room
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") joinRoom(); }}
                placeholder="Enter room ID..."
                className="flex-1 bg-[#1A1714] border border-[#3D3530] rounded-xl px-3 py-2.5 text-sm text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none focus:border-[#C48C56]/40"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button
                onClick={joinRoom}
                disabled={!joinRoomInput.trim()}
                className="px-4 py-2.5 bg-[#3D3530] text-[#F2EFEA]/80 rounded-xl text-sm hover:bg-[#3D3530]/80 transition-colors disabled:opacity-30"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Join
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push("/chat")}
            className="w-full text-center text-xs text-[#F2EFEA]/30 hover:text-[#F2EFEA]/50 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    {
      id: "whiteboard",
      label: "Whiteboard",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      ),
    },
    {
      id: "document",
      label: "Document",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
    },
    {
      id: "video",
      label: "Video Call",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="5" width="15" height="14" rx="2" />
          <path d="M17 9l5-3v12l-5-3" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", backgroundColor: "#1A1714", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 44, flexShrink: 0,
        backgroundColor: "#1A1714", borderBottom: "1px solid #2C2824",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setRoomId(""); roomInitialized.current = false; window.history.replaceState(null, "", "/collaborate"); }}
            className="text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: 12, color: "rgba(242,239,234,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Room: <span style={{ color: "rgba(196,140,86,0.7)" }}>{roomId}</span>
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, backgroundColor: "#2C2824", borderRadius: 8, padding: 2 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", fontSize: 12, borderRadius: 6,
                border: "none", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: activeTab === tab.id ? "#C48C56" : "transparent",
                color: activeTab === tab.id ? "white" : "rgba(242,239,234,0.4)",
                transition: "all 0.2s",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/collaborate?room=${roomId}`)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", fontSize: 11, borderRadius: 6,
              border: "none", cursor: "pointer",
              backgroundColor: "#2C2824", color: "rgba(242,239,234,0.6)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Link
          </button>
          <button
            onClick={() => router.push("/chat")}
            style={{
              padding: "5px 12px", fontSize: 11, borderRadius: 6,
              border: "none", cursor: "pointer",
              backgroundColor: "transparent", color: "rgba(242,239,234,0.3)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* Content area - ALL tabs rendered but only active one visible */}
      {/* This prevents tldraw from unmounting when switching tabs */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            name: session?.user?.name || "Anonymous",
            color: "#C48C56",
            avatar: session?.user?.image || undefined,
          }}
        >
          {/* Whiteboard tab - always mounted, hidden when not active */}
          <div style={{
            position: "absolute", inset: 0,
            display: activeTab === "whiteboard" ? "block" : "none",
          }}>
            <CollaborativeWhiteboard roomId={roomId} />
          </div>

          {/* Document tab */}
          <div style={{
            position: "absolute", inset: 0,
            display: activeTab === "document" ? "block" : "none",
          }}>
            <CollaborativeEditor roomId={roomId} />
          </div>
        </RoomProvider>

        {/* Video tab - outside RoomProvider since it uses Stream */}
        <div style={{
          position: "absolute", inset: 0,
          display: activeTab === "video" ? "block" : "none",
        }}>
          <VideoCall
            roomId={roomId}
            userName={session?.user?.name || "Anonymous"}
            userImage={session?.user?.image || undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function CollaboratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A1714] flex items-center justify-center">
          <div className="relative inline-flex text-[#C48C56]">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      }
    >
      <CollaborateContent />
    </Suspense>
  );
}
