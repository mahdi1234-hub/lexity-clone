"use client";

import { memo } from "react";

interface ImageWidgetProps {
  title?: string;
  images: { url: string; title?: string; source?: string }[];
}

function ImageWidget({ title, images }: ImageWidgetProps) {
  return (
    <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 380, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {title && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1 p-2">
        {images.slice(0, 4).map((img, i) => (
          <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
            <img src={img.url} alt={img.title || ""} className="w-full h-24 object-cover" />
            {img.title && <p className="text-[9px] text-[#F2EFEA]/40 px-1.5 py-1 truncate">{img.title}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}

export default memo(ImageWidget);
