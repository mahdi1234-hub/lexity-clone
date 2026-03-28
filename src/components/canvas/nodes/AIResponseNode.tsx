"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface AIResponseData {
  content: string;
  model?: string;
  timestamp?: string;
  userName?: string;
  isUser?: boolean;
  color?: string;
}

function AIResponseNode({ data, selected }: NodeProps & { data: AIResponseData }) {
  const d = data as unknown as AIResponseData;
  const isUser = d.isUser || false;

  return (
    <div
      className={`group relative rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-200 ${
        selected ? "ring-2 ring-[#C48C56]/60 shadow-xl" : "hover:shadow-xl"
      } ${
        isUser
          ? "bg-[#C48C56]/10 border border-[#C48C56]/20 max-w-[360px]"
          : "bg-white/90 border border-black/5 max-w-[420px]"
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#C48C56] !w-2 !h-2 !border-2 !border-white" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
          style={{ backgroundColor: d.color || (isUser ? "#C48C56" : "#7986CB") }}
        >
          {isUser ? (d.userName?.[0] || "U") : "AI"}
        </div>
        <span className="text-xs font-medium text-[#2C2824]/60">
          {isUser ? (d.userName || "You") : (d.model || "AI Assistant")}
        </span>
        {d.timestamp && (
          <span className="text-[10px] text-[#2C2824]/30 ml-auto">{d.timestamp}</span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-1">
        <div className="text-sm text-[#2C2824]/80 leading-relaxed whitespace-pre-wrap break-words">
          {d.content}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#C48C56] !w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(AIResponseNode);
