"use client";

import { useState, useCallback } from "react";
import { useThreads, useCreateThread, useSelf } from "../../liveblocks.config";

export default function OverlayComments() {
  const { threads } = useThreads();
  const createThread = useCreateThread();
  const self = useSelf();
  const [isPlacing, setIsPlacing] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  // Place a new comment pin on the whiteboard
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isPlacing || !self) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createThread({
        body: {
          version: 1,
          content: [
            {
              type: "paragraph",
              children: [{ text: newCommentText.trim() || "New comment" }],
            },
          ],
        },
        metadata: {
          x,
          y,
          resolved: false,
          zIndex: (threads?.length || 0) + 1,
        },
      });

      setIsPlacing(false);
      setNewCommentText("");
    },
    [isPlacing, self, createThread, threads, newCommentText]
  );

  // Extract text from comment body
  const getCommentText = (body: unknown): string => {
    try {
      const b = body as { content?: Array<{ children?: Array<{ text?: string }> }> };
      return b?.content?.[0]?.children?.[0]?.text || "";
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Pin placement overlay */}
      <div
        className={`absolute inset-0 z-30 ${
          isPlacing ? "cursor-crosshair" : "pointer-events-none"
        }`}
        onClick={handleCanvasClick}
      >
        {/* Existing comment pins */}
        {threads
          ?.filter((t) => t.metadata?.x && t.metadata?.y)
          .map((thread) => {
            const isActive = activePin === thread.id;
            const isResolved = thread.metadata?.resolved;
            const firstComment = thread.comments?.[0];
            const commentText = firstComment
              ? getCommentText(firstComment.body)
              : "";

            return (
              <div
                key={thread.id}
                className="absolute pointer-events-auto"
                style={{
                  left: thread.metadata.x,
                  top: thread.metadata.y,
                  zIndex: thread.metadata?.zIndex || 1,
                  transform: "translate(-12px, -12px)",
                }}
              >
                {/* Pin marker */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePin(isActive ? null : thread.id);
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-110 ${
                    isResolved
                      ? "bg-[#6B8E6B] text-white"
                      : "bg-[#C48C56] text-white"
                  } ${isActive ? "scale-125 ring-2 ring-white/40" : ""}`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Expanded comment bubble */}
                {isActive && (
                  <div
                    className="absolute left-8 top-0 w-56 bg-[#2C2824]/95 backdrop-blur-xl rounded-xl border border-[#3D3530] shadow-2xl p-3 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p
                      className="text-xs text-[#F2EFEA]/80 mb-2"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {commentText || "Empty comment"}
                    </p>
                    {(thread.comments?.length || 0) > 1 && (
                      <p className="text-[10px] text-[#C48C56]/60 mb-1">
                        +{thread.comments!.length - 1} more repl
                        {thread.comments!.length - 1 === 1 ? "y" : "ies"}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[#3D3530]/50">
                      <span
                        className={`text-[10px] ${
                          isResolved
                            ? "text-[#6B8E6B]"
                            : "text-[#F2EFEA]/30"
                        }`}
                      >
                        {isResolved ? "Resolved" : "Open"}
                      </span>
                      <button
                        onClick={() => setActivePin(null)}
                        className="text-[10px] text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Floating action button to place new pins */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-auto">
        {isPlacing ? (
          <div className="flex items-center gap-2 bg-[#2C2824]/95 backdrop-blur-xl rounded-xl border border-[#C48C56]/40 p-2 shadow-xl">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Comment text..."
              className="bg-transparent border-none text-xs text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none w-40"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              autoFocus
            />
            <button
              onClick={() => {
                setIsPlacing(false);
                setNewCommentText("");
              }}
              className="text-xs text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsPlacing(true)}
            className="flex items-center gap-2 bg-[#C48C56] text-white px-4 py-2 rounded-xl shadow-lg hover:bg-[#C48C56]/80 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs font-medium">Pin Comment</span>
          </button>
        )}
      </div>
    </>
  );
}
