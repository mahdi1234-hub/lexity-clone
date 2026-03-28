"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface WidgetItem {
  id: string;
  title: string;
  subtitle?: string;
  time?: string;
  status?: "unread" | "read" | "upcoming" | "done" | "pending";
  icon?: string;
}

interface WidgetData {
  widgetType: "email" | "calendar" | "tasks" | "meet" | "notes" | "weather" | "clock";
  title: string;
  items: WidgetItem[];
  accentColor?: string;
}

const widgetIcons: Record<string, JSX.Element> = {
  email: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  tasks: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  meet: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  notes: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  weather: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 18a5 5 0 0 0-5-5 5 5 0 0 0-5 5M12 9V2M4.22 10.22l1.42 1.42M1 18h2M19.78 10.22l-1.42 1.42M23 18h-2" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

const accentColors: Record<string, string> = {
  email: "#E57373",
  calendar: "#64B5F6",
  tasks: "#81C784",
  meet: "#FFB74D",
  notes: "#BA68C8",
  weather: "#4FC3F7",
  clock: "#FFD54F",
};

const statusDots: Record<string, string> = {
  unread: "bg-[#E57373]",
  read: "bg-[#81C784]",
  upcoming: "bg-[#64B5F6]",
  done: "bg-[#81C784]",
  pending: "bg-[#FFB74D]",
};

function WidgetNode({ data, selected }: NodeProps & { data: WidgetData }) {
  const d = data as unknown as WidgetData;
  const accent = d.accentColor || accentColors[d.widgetType] || "#C48C56";
  const icon = widgetIcons[d.widgetType] || widgetIcons.notes;

  return (
    <div
      className={`group relative rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-200 ${
        selected ? "ring-2 shadow-xl" : "hover:shadow-xl"
      } bg-white/90 border border-black/5`}
      style={{
        width: 280,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderColor: selected ? `${accent}60` : undefined,
        boxShadow: selected ? `0 0 0 2px ${accent}30` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: accent }} className="!w-2 !h-2 !border-2 !border-white" />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 border-b border-black/5">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-[#2C2824]/80">{d.title}</h3>
          <p className="text-[10px] text-[#2C2824]/30 capitalize">{d.widgetType}</p>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}15`, color: accent }}>
          {d.items.length}
        </span>
      </div>

      {/* Items */}
      <div className="px-3 py-2 space-y-1 max-h-[200px] overflow-y-auto">
        {d.items.length === 0 && (
          <p className="text-xs text-[#2C2824]/25 text-center py-4">No items</p>
        )}
        {d.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-black/3 transition-colors"
          >
            {item.status && (
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[item.status] || "bg-gray-300"}`} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#2C2824]/70 truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-[10px] text-[#2C2824]/30 truncate">{item.subtitle}</p>
              )}
            </div>
            {item.time && (
              <span className="text-[10px] text-[#2C2824]/25 flex-shrink-0">{item.time}</span>
            )}
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: accent }} className="!w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(WidgetNode);
