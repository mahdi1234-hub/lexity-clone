"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { RoomProvider } from "../../../liveblocks.config";
import dynamic from "next/dynamic";

const CollaborativeWhiteboard = dynamic(
  () => import("@/components/CollaborativeWhiteboard"),
  { ssr: false }
);

function CollaborateContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string>("");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  // Room joining state managed by URL params

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const room = searchParams.get("room");
    if (room) {
      setRoomId(room);
    }
  }, [searchParams]);

  const createRoom = () => {
    const newRoomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setRoomId(newRoomId);
    router.push(`/collaborate?room=${newRoomId}`);
  };

  const joinRoom = () => {
    if (!joinRoomInput.trim()) return;
    setRoomId(joinRoomInput.trim());
    router.push(`/collaborate?room=${joinRoomInput.trim()}`);
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
              Whiteboard, comments, and overlay annotations with your team
            </p>
          </div>

          {/* Create room */}
          <div className="bg-[#2C2824] rounded-2xl border border-[#3D3530] p-6 mb-4">
            <h2
              className="text-sm font-medium text-[#F2EFEA]/80 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create a New Room
            </h2>
            <p className="text-xs text-[#F2EFEA]/30 mb-4">
              Start a fresh collaborative whiteboard and invite others.
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
            <h2
              className="text-sm font-medium text-[#F2EFEA]/80 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Join an Existing Room
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") joinRoom();
                }}
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

          {/* Back to chat */}
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

  // Room is selected - render collaborative whiteboard
  return (
    <div className="h-screen w-screen bg-[#1A1714] flex flex-col">
      {/* Top bar with room info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1714] border-b border-[#2C2824]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRoomId("");
              router.push("/collaborate");
            }}
            className="text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span
            className="text-xs text-[#F2EFEA]/50"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Room: <span className="text-[#C48C56]/70">{roomId}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/collaborate?room=${roomId}`
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2C2824] text-[#F2EFEA]/60 rounded-lg text-xs hover:text-[#F2EFEA]/80 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Invite Link
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[#F2EFEA]/40 text-xs hover:text-[#F2EFEA]/60 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* Whiteboard */}
      <div className="flex-1 relative">
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            name: session?.user?.name || "Anonymous",
            color: "#C48C56",
            avatar: session?.user?.image || undefined,
          }}
        >
          <CollaborativeWhiteboard roomId={roomId} />
        </RoomProvider>
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
