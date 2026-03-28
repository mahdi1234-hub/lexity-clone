"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface AINodeData {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isWelcome?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  userName?: string;
  userColor?: string;
  [key: string]: unknown;
}

function AICanvasNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AINodeData;
  const [expanded, setExpanded] = useState(false);
  const isUser = nodeData.role === "user";
  const isAssistant = nodeData.role === "assistant";
  const isWelcome = nodeData.isWelcome;
  const isLoading = nodeData.isLoading;
  const isError = nodeData.isError;

  const content = nodeData.content || "";
  const shouldTruncate = content.length > 300 && !expanded;
  const displayContent = shouldTruncate
    ? content.slice(0, 300) + "..."
    : content;

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (isWelcome) {
    return (
      <div
        className={`rounded-2xl border-2 px-6 py-5 max-w-[380px] shadow-xl transition-all ${
          selected
            ? "border-[#C48C56] shadow-[#C48C56]/20"
            : "border-[#3D3530] shadow-black/20"
        }`}
        style={{
          background: "linear-gradient(135deg, #2C2824 0%, #1A1714 100%)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Handle type="source" position={Position.Bottom} className="!bg-[#C48C56] !w-3 !h-3 !border-2 !border-[#1A1714]" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C48C56] to-[#8B6B3D] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-medium text-[#C48C56]">AI Canvas</span>
        </div>
        <p className="text-xs text-[#F2EFEA]/60 leading-relaxed">{content}</p>
      </div>
    );
  }

  if (isUser) {
    return (
      <div
        className={`rounded-2xl border-2 px-5 py-4 max-w-[380px] shadow-xl transition-all ${
          selected
            ? "border-[#C48C56] shadow-[#C48C56]/20"
            : "border-[#C48C56]/30 shadow-black/20"
        }`}
        style={{
          background: "linear-gradient(135deg, #3D3530 0%, #2C2824 100%)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-[#C48C56] !w-3 !h-3 !border-2 !border-[#1A1714]" />
        <Handle type="source" position={Position.Bottom} className="!bg-[#C48C56] !w-3 !h-3 !border-2 !border-[#1A1714]" />
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: (nodeData.userColor as string) || "#C48C56" }}
          >
            {((nodeData.userName as string) || "U")[0].toUpperCase()}
          </div>
          <span className="text-[10px] text-[#F2EFEA]/40">
            {(nodeData.userName as string) || "You"}
          </span>
          <span className="text-[10px] text-[#F2EFEA]/20 ml-auto">
            {formatTime(nodeData.timestamp)}
          </span>
        </div>
        <p className="text-sm text-[#F2EFEA]/90 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div
        className={`rounded-2xl border-2 px-5 py-4 max-w-[420px] shadow-xl transition-all ${
          selected
            ? "border-[#7986CB] shadow-[#7986CB]/20"
            : "border-[#3D3530] shadow-black/20"
        } ${isError ? "border-red-500/30" : ""}`}
        style={{
          background: isError
            ? "linear-gradient(135deg, #2C2020 0%, #1A1714 100%)"
            : "linear-gradient(135deg, #2C2824 0%, #1A1714 100%)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-[#7986CB] !w-3 !h-3 !border-2 !border-[#1A1714]" />
        <Handle type="source" position={Position.Bottom} className="!bg-[#7986CB] !w-3 !h-3 !border-2 !border-[#1A1714]" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-[#7986CB] flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[10px] text-[#7986CB]/60">AI</span>
          {isLoading && (
            <span className="text-[10px] text-[#C48C56] animate-pulse">thinking...</span>
          )}
          <span className="text-[10px] text-[#F2EFEA]/20 ml-auto">
            {formatTime(nodeData.timestamp)}
          </span>
        </div>

        {isLoading && !content ? (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-[#F2EFEA]/30">Generating response...</span>
          </div>
        ) : (
          <>
            <div className="text-xs text-[#F2EFEA]/70 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </div>
            {content.length > 300 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-[#C48C56]/60 hover:text-[#C48C56] mt-2 transition-colors"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}

        {/* Branch indicator */}
        {selected && !isLoading && !isError && (
          <div className="mt-3 pt-2 border-t border-[#3D3530]">
            <p className="text-[10px] text-[#7986CB]/50">
              Click send to branch from this response
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default memo(AICanvasNode);
