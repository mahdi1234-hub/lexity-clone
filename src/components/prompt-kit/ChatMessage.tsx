"use client";

import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  userName?: string;
  userImage?: string;
  timestamp?: string;
  isStreaming?: boolean;
  files?: { id: string; name: string; type: string; size: number; preview?: string }[];
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/5 transition-all"
      title="Copy message"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-[#6B8E6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function ChatMessage({
  role,
  content,
  userName,
  userImage,
  timestamp,
  isStreaming,
  files,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""} mb-4`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          userImage ? (
            <img src={userImage} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#C48C56] flex items-center justify-center text-xs font-medium text-white">
              {(userName || "U")[0].toUpperCase()}
            </div>
          )
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7986CB] to-[#5C6BC0] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {/* Name and time */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span
            className="text-[10px] font-medium opacity-50"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isUser ? userName || "You" : "AI"}
          </span>
          {timestamp && (
            <span className="text-[10px] opacity-25">
              {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Files */}
        {files && files.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mb-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#C48C56]/10 border border-[#C48C56]/20 text-[10px]"
              >
                <svg className="w-3 h-3 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="opacity-60 truncate max-w-[100px]">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[#2C2824] text-[#F2EFEA]"
              : "bg-white/50 backdrop-blur-sm text-[#2C2824] border border-black/5"
          }`}
        >
          {isStreaming && !content ? (
            <LoadingDots />
          ) : isUser ? (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {content}
            </p>
          ) : (
            <div
              className="text-sm leading-relaxed prose-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>

        {/* Actions */}
        {!isUser && content && !isStreaming && (
          <div className="flex items-center gap-1 mt-1">
            <CopyMessageButton text={content} />
          </div>
        )}
      </div>
    </div>
  );
}
