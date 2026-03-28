"use client";

import { useCallback, useEffect, useState } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useOthers, useMyPresence, useSelf } from "../../liveblocks.config";
import CollaborationCursors from "./CollaborationCursors";
import CollaborationComments from "./CollaborationComments";
import OverlayComments from "./OverlayComments";

interface CollaborativeWhiteboardProps {
  roomId: string;
}

export default function CollaborativeWhiteboard({ roomId }: CollaborativeWhiteboardProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const others = useOthers();
  const self = useSelf();
  const [, updateMyPresence] = useMyPresence();
  const [showComments, setShowComments] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Track pointer for cursor sharing
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      });
    },
    [updateMyPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Sync tldraw changes across users via presence
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      // TLDraw handles its own state; we just need cursor presence
    };

    editor.on("change" as never, handleChange);
    return () => {
      editor.off("change" as never, handleChange);
    };
  }, [editor]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2C2824] border-b border-[#3D3530]">
        <div className="flex items-center gap-3">
          <h2
            className="text-sm font-medium text-[#F2EFEA]/80"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Collaborative Whiteboard
          </h2>
          <span className="text-xs text-[#C48C56]/60 px-2 py-0.5 rounded-full bg-[#C48C56]/10">
            {roomId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active collaborators */}
          <div className="flex items-center -space-x-2">
            {self && (
              <div
                className="w-7 h-7 rounded-full border-2 border-[#2C2824] flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: self.info?.color || "#C48C56" }}
                title={`${self.info?.name || "You"} (you)`}
              >
                {(self.info?.name || "Y")[0].toUpperCase()}
              </div>
            )}
            {others.map((other) => (
              <div
                key={other.connectionId}
                className="w-7 h-7 rounded-full border-2 border-[#2C2824] flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: other.info?.color || "#7986CB" }}
                title={other.info?.name || "Collaborator"}
              >
                {(other.info?.name || "?")[0].toUpperCase()}
              </div>
            ))}
          </div>

          <span className="text-xs text-[#F2EFEA]/40">
            {others.length + 1} online
          </span>

          <div className="h-4 w-px bg-[#3D3530]" />

          {/* Toggle buttons */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showComments
                ? "bg-[#C48C56]/20 text-[#C48C56]"
                : "text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Comments
          </button>
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showOverlay
                ? "bg-[#C48C56]/20 text-[#C48C56]"
                : "text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Overlay
          </button>
        </div>
      </div>

      {/* Main whiteboard area */}
      <div
        className="relative flex-1"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <Tldraw
          onMount={(editorInstance: Editor) => {
            setEditor(editorInstance);
          }}
        />

        {/* Collaboration cursors overlay */}
        <CollaborationCursors />

        {/* Overlay comments pinned on the whiteboard */}
        {showOverlay && <OverlayComments />}
      </div>

      {/* Side panel for thread comments */}
      {showComments && (
        <div className="absolute right-0 top-[52px] bottom-0 w-80 bg-[#2C2824]/95 backdrop-blur-xl border-l border-[#3D3530] overflow-hidden z-50">
          <CollaborationComments />
        </div>
      )}
    </div>
  );
}
