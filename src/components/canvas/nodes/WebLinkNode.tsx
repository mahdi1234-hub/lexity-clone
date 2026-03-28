"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface WebLinkData {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
}

function WebLinkNode({ data, selected }: NodeProps & { data: WebLinkData }) {
  const d = data as unknown as WebLinkData;
  const domain = (() => {
    try { return new URL(d.url).hostname; } catch { return d.url; }
  })();

  return (
    <div
      className={`group relative rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-200 max-w-[300px] ${
        selected ? "ring-2 ring-[#C48C56]/60 shadow-xl" : "hover:shadow-xl"
      } bg-white/90 border border-black/5`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#9B7BA8] !w-2 !h-2 !border-2 !border-white" />

      {d.image && (
        <img src={d.image} alt="" className="w-full h-32 object-cover rounded-t-2xl" />
      )}

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {d.favicon && <img src={d.favicon} alt="" className="w-4 h-4 rounded" />}
          <span className="text-[10px] text-[#2C2824]/40 truncate">{domain}</span>
          <svg className="w-3 h-3 text-[#2C2824]/20 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-[#2C2824]/80 line-clamp-2 mb-1">{d.title}</h3>
        {d.description && (
          <p className="text-xs text-[#2C2824]/40 line-clamp-2">{d.description}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#9B7BA8] !w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(WebLinkNode);
