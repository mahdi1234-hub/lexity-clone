"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface ImageData {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
}

function ImageNode({ data, selected }: NodeProps & { data: ImageData }) {
  const d = data as unknown as ImageData;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg transition-all duration-200 ${
        selected ? "ring-2 ring-[#C48C56]/60 shadow-xl" : "hover:shadow-xl"
      } bg-white/90 border border-black/5`}
      style={{ width: d.width || 280, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#7B9EA8] !w-2 !h-2 !border-2 !border-white" />

      <img
        src={d.src}
        alt={d.alt || "Image"}
        className="w-full h-auto object-cover"
        style={{ maxHeight: 300 }}
      />

      {d.caption && (
        <div className="px-3 py-2">
          <p className="text-xs text-[#2C2824]/50">{d.caption}</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#7B9EA8] !w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(ImageNode);
