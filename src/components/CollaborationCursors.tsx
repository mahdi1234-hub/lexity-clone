"use client";

import { useOthers } from "../../liveblocks.config";

export default function CollaborationCursors() {
  const others = useOthers();

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {others.map((other) => {
        if (!other.presence?.cursor) return null;
        return (
          <div
            key={other.connectionId}
            className="absolute transition-transform duration-75"
            style={{
              left: other.presence.cursor.x,
              top: other.presence.cursor.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <path
                d="M3 3L10 17L12 10L19 8L3 3Z"
                fill={other.info?.color || "#7986CB"}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap shadow-lg"
              style={{
                backgroundColor: other.info?.color || "#7986CB",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {other.info?.name || "Anonymous"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
