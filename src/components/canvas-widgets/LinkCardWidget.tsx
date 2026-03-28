"use client";

import { memo } from "react";

interface LinkCardWidgetProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

function LinkCardWidget({ title, url, description, image, favicon, siteName }: LinkCardWidgetProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden hover:border-[#C48C56]/30 transition-colors"
      style={{ width: 340, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {image && (
        <div className="h-36 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-[#F2EFEA]/90 line-clamp-2 leading-relaxed">{title}</p>
        {description && (
          <p className="text-[10px] text-[#F2EFEA]/40 line-clamp-2 mt-1 leading-relaxed">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {favicon && <img src={favicon} alt="" className="w-3.5 h-3.5 rounded" />}
          <span className="text-[10px] text-[#C48C56]/60 truncate">
            {siteName || new URL(url).hostname}
          </span>
          <svg className="w-3 h-3 text-[#F2EFEA]/20 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </a>
  );
}

export default memo(LinkCardWidget);
