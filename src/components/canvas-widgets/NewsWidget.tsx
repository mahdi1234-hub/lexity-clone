"use client";

import { memo } from "react";

interface NewsItem {
  title: string;
  description?: string;
  url: string;
  image?: string;
  source?: string;
  publishedDate?: string;
  favicon?: string;
}

interface NewsWidgetProps {
  title: string;
  items: NewsItem[];
  query?: string;
}

function NewsWidget({ title, items, query }: NewsWidgetProps) {
  return (
    <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 380, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-4 pt-3 pb-2 border-b border-[#3D3530]/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
          </svg>
          <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
        </div>
        {query && <p className="text-[10px] text-[#F2EFEA]/30 mt-0.5">Search: {query}</p>}
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {items.slice(0, 5).map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-[#3D3530]/30 last:border-b-0"
          >
            {item.image && (
              <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#F2EFEA]/80 line-clamp-2 leading-relaxed">{item.title}</p>
              {item.description && (
                <p className="text-[10px] text-[#F2EFEA]/40 line-clamp-1 mt-0.5">{item.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {item.favicon && <img src={item.favicon} alt="" className="w-3 h-3 rounded" />}
                {item.source && <span className="text-[9px] text-[#C48C56]/60">{item.source}</span>}
                {item.publishedDate && <span className="text-[9px] text-[#F2EFEA]/20">{item.publishedDate}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
      {items.length > 5 && (
        <div className="px-4 py-2 text-center">
          <span className="text-[10px] text-[#C48C56]/50">+{items.length - 5} more results</span>
        </div>
      )}
    </div>
  );
}

export default memo(NewsWidget);
