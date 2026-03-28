"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface TextData {
  content: string;
  color?: string;
  title?: string;
  editable?: boolean;
}

function TextNode({ data, selected }: NodeProps & { data: TextData }) {
  const d = data as unknown as TextData;
  const [isEditing, setIsEditing] = useState(false);
  const bgColor = d.color || "#F2EFEA";

  return (
    <div
      className={`group relative rounded-2xl shadow-lg transition-all duration-200 ${
        selected ? "ring-2 ring-[#C48C56]/60 shadow-xl" : "hover:shadow-xl"
      } border border-black/5`}
      style={{
        backgroundColor: bgColor,
        maxWidth: 320,
        minWidth: 180,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#8B8B6B] !w-2 !h-2 !border-2 !border-white" />

      <div className="px-4 py-3">
        {d.title && (
          <h3 className="text-xs font-semibold text-[#2C2824]/60 mb-1.5">{d.title}</h3>
        )}
        {isEditing ? (
          <textarea
            defaultValue={d.content}
            className="w-full bg-transparent text-sm text-[#2C2824]/80 resize-none outline-none leading-relaxed min-h-[60px]"
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <p
            className="text-sm text-[#2C2824]/80 leading-relaxed whitespace-pre-wrap cursor-text"
            onDoubleClick={() => d.editable !== false && setIsEditing(true)}
          >
            {d.content}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#8B8B6B] !w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(TextNode);
