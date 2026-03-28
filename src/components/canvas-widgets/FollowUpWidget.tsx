"use client";

import { memo } from "react";

interface FollowUpWidgetProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

function FollowUpWidget({ suggestions, onSelect }: FollowUpWidgetProps) {
  return (
    <div className="rounded-2xl border-2 border-[#C48C56]/20 bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 340, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span className="text-xs font-medium text-[#C48C56]/80">Follow-up Questions</span>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion)}
            className="w-full text-left px-3 py-2 rounded-xl border border-[#3D3530]/50 hover:border-[#C48C56]/30 hover:bg-[#C48C56]/5 transition-all text-xs text-[#F2EFEA]/60 hover:text-[#F2EFEA]/80"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(FollowUpWidget);
