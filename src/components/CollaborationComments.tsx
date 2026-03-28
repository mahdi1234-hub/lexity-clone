"use client";

import { useState, useRef } from "react";
import { useThreads, useCreateThread, useCreateComment, useSelf, useEditThreadMetadata } from "../../liveblocks.config";

export default function CollaborationComments() {
  const { threads } = useThreads();
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const editThreadMetadata = useEditThreadMetadata();
  const self = useSelf();
  const [newThreadBody, setNewThreadBody] = useState("");
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreateThread = () => {
    if (!newThreadBody.trim() || !self) return;

    createThread({
      body: {
        version: 1,
        content: [
          {
            type: "paragraph",
            children: [{ text: newThreadBody.trim() }],
          },
        ],
      },
      metadata: {
        x: 0,
        y: 0,
        resolved: false,
        zIndex: 1,
      },
    });

    setNewThreadBody("");
  };

  const handleReply = (threadId: string) => {
    const body = replyBodies[threadId]?.trim();
    if (!body) return;

    createComment({
      threadId,
      body: {
        version: 1,
        content: [
          {
            type: "paragraph",
            children: [{ text: body }],
          },
        ],
      },
    });

    setReplyBodies((prev) => ({ ...prev, [threadId]: "" }));
  };

  const toggleResolved = (threadId: string, currentResolved: boolean) => {
    editThreadMetadata({
      threadId,
      metadata: { resolved: !currentResolved },
    });
  };

  // Extract text from comment body
  const getCommentText = (body: unknown): string => {
    try {
      const b = body as { content?: Array<{ children?: Array<{ text?: string }> }> };
      return b?.content?.[0]?.children?.[0]?.text || "";
    } catch {
      return "";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3D3530]">
        <h3
          className="text-sm font-medium text-[#F2EFEA]/90"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Discussion
        </h3>
        <p className="text-xs text-[#F2EFEA]/40 mt-0.5">
          {threads?.length || 0} thread{(threads?.length || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Thread list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {(!threads || threads.length === 0) && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#C48C56]/10 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#C48C56]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#F2EFEA]/30" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              No discussions yet. Start one below.
            </p>
          </div>
        )}

        {threads?.map((thread) => {
          const isExpanded = expandedThread === thread.id;
          const isResolved = thread.metadata?.resolved;
          const firstComment = thread.comments?.[0];

          return (
            <div
              key={thread.id}
              className={`rounded-xl border transition-colors ${
                isResolved
                  ? "bg-[#6B8E6B]/5 border-[#6B8E6B]/20 opacity-60"
                  : "bg-[#F2EFEA]/5 border-[#3D3530] hover:border-[#C48C56]/30"
              }`}
            >
              {/* Thread header */}
              <div
                className="px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedThread(isExpanded ? null : thread.id)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-white mt-0.5"
                    style={{ backgroundColor: "#C48C56" }}
                  >
                    {(firstComment as unknown as { userId?: string })?.userId?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs text-[#F2EFEA]/80 line-clamp-2"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {firstComment ? getCommentText(firstComment.body) : "Empty thread"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#F2EFEA]/30">
                        {firstComment ? formatTime(firstComment.createdAt.toISOString()) : ""}
                      </span>
                      {(thread.comments?.length || 0) > 1 && (
                        <span className="text-[10px] text-[#C48C56]/60">
                          {thread.comments!.length - 1} repl{thread.comments!.length - 1 === 1 ? "y" : "ies"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleResolved(thread.id, !!isResolved);
                    }}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border transition-colors ${
                      isResolved
                        ? "bg-[#6B8E6B] border-[#6B8E6B]"
                        : "border-[#3D3530] hover:border-[#C48C56]"
                    }`}
                    title={isResolved ? "Unresolve" : "Resolve"}
                  >
                    {isResolved && (
                      <svg className="w-3 h-3 text-white mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded thread with replies */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-[#3D3530]/50">
                  {/* All comments in thread */}
                  <div className="space-y-2 mt-2">
                    {thread.comments?.slice(1).map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 pl-2">
                        <div className="w-1 h-1 rounded-full bg-[#C48C56]/30 mt-2 flex-shrink-0" />
                        <div>
                          <p
                            className="text-xs text-[#F2EFEA]/70"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {getCommentText(comment.body)}
                          </p>
                          <span className="text-[10px] text-[#F2EFEA]/25">
                            {formatTime(comment.createdAt.toISOString())}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply input */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={replyBodies[thread.id] || ""}
                      onChange={(e) =>
                        setReplyBodies((prev) => ({
                          ...prev,
                          [thread.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(thread.id);
                        }
                      }}
                      placeholder="Reply..."
                      className="flex-1 bg-[#1A1714] border border-[#3D3530] rounded-lg px-2.5 py-1.5 text-xs text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none focus:border-[#C48C56]/40"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button
                      onClick={() => handleReply(thread.id)}
                      className="p-1.5 rounded-lg bg-[#C48C56]/20 text-[#C48C56] hover:bg-[#C48C56]/30 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New thread input */}
      <div className="px-3 py-3 border-t border-[#3D3530]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newThreadBody}
            onChange={(e) => setNewThreadBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateThread();
              }
            }}
            placeholder="Start a new discussion..."
            className="flex-1 bg-[#1A1714] border border-[#3D3530] rounded-xl px-3 py-2 text-xs text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none focus:border-[#C48C56]/40"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button
            onClick={handleCreateThread}
            disabled={!newThreadBody.trim()}
            className="p-2 rounded-xl bg-[#C48C56] text-white hover:bg-[#C48C56]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
