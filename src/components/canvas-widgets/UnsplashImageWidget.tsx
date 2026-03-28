"use client";

import { memo, useState, useCallback } from "react";

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  small: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  link: string;
}

interface UnsplashImageWidgetProps {
  initialQuery?: string;
  onImageSelect?: (image: UnsplashImage) => void;
  expanded?: boolean;
}

// Default curated images shown before any search
const DEFAULT_IMAGES: UnsplashImage[] = [
  { id: "d1", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600", thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200", small: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400", alt: "Mountain landscape", photographer: "Bailey Zindel", photographerUrl: "https://unsplash.com/@baileyzindel", link: "https://unsplash.com/photos/nrqv_x7sMk" },
  { id: "d2", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600", thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200", small: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", alt: "Starry night mountains", photographer: "Benjamin Voros", photographerUrl: "https://unsplash.com/@vorosbenisop", link: "https://unsplash.com/photos/phIFdC6lA4E" },
  { id: "d3", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600", thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200", small: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400", alt: "Foggy forest", photographer: "v2osk", photographerUrl: "https://unsplash.com/@v2osk", link: "https://unsplash.com/photos/1Z2niiBPg5A" },
  { id: "d4", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600", thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200", small: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", alt: "Sunlit forest path", photographer: "Lukasz Szmigiel", photographerUrl: "https://unsplash.com/@szmigieldesign", link: "https://unsplash.com/photos/jFCViYFYcus" },
];

function UnsplashImageWidget({ initialQuery, onImageSelect, expanded }: UnsplashImageWidgetProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [images, setImages] = useState<UnsplashImage[]>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(true); // show defaults immediately
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);
  const width = expanded ? 600 : 380;

  const searchImages = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&per_page=12`);
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelect = (img: UnsplashImage) => {
    setSelectedImage(img);
    onImageSelect?.(img);
  };

  return (
    <div
      className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden"
      style={{ width, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-[#3D3530]/50">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[#F2EFEA]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-sm font-medium text-[#F2EFEA]/90">Image Search</span>
        </div>
        {/* Search bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") searchImages(); }}
            placeholder="Search images..."
            className="flex-1 bg-[#1A1714] border border-[#3D3530] rounded-lg px-2.5 py-1.5 text-xs text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none focus:border-[#C48C56]/40"
          />
          <button
            onClick={searchImages}
            disabled={loading || !query.trim()}
            className="px-3 py-1.5 text-xs font-medium bg-[#C48C56] text-white rounded-lg hover:bg-[#C48C56]/80 disabled:opacity-30 transition-colors"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Selected image display */}
      {selectedImage && (
        <div className="p-3 border-b border-[#3D3530]/50">
          <img src={selectedImage.url} alt={selectedImage.alt} className="w-full h-40 object-cover rounded-xl" />
          <div className="flex items-center justify-between mt-2">
            <a href={selectedImage.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C48C56]/60 hover:text-[#C48C56]">
              Photo by {selectedImage.photographer}
            </a>
            <button onClick={() => setSelectedImage(null)} className="text-[10px] text-[#F2EFEA]/30 hover:text-[#F2EFEA]/60">
              Change
            </button>
          </div>
        </div>
      )}

      {/* Image grid */}
      {!selectedImage && searched && (
        <div className="max-h-[280px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-5 h-5 text-[#C48C56] animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-xs text-[#F2EFEA]/30 py-8">No images found</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleSelect(img)}
                  className="rounded-lg overflow-hidden hover:ring-2 hover:ring-[#C48C56] transition-all"
                >
                  <img src={img.thumb} alt={img.alt} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && !selectedImage && (
        <div className="p-6 text-center">
          <p className="text-xs text-[#F2EFEA]/30">Search for images to add to your canvas</p>
        </div>
      )}
    </div>
  );
}

export default memo(UnsplashImageWidget);
