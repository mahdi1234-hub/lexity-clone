"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";

interface GroupData {
  label: string;
  color?: string;
  width?: number;
  height?: number;
}

function GroupNode({ data, selected }: NodeProps & { data: GroupData }) {
  const d = data as unknown as GroupData;

  return (
    <div
      className={`rounded-3xl transition-all duration-200 ${
        selected ? "ring-2 ring-[#C48C56]/40" : ""
      }`}
      style={{
        width: d.width || 400,
        height: d.height || 300,
        backgroundColor: `${d.color || "#C48C56"}08`,
        border: `1.5px dashed ${d.color || "#C48C56"}30`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="px-4 pt-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${d.color || "#C48C56"}15`,
            color: d.color || "#C48C56",
          }}
        >
          {d.label || "Group"}
        </span>
      </div>
    </div>
  );
}

export default memo(GroupNode);
