"use client";

import { useState, useCallback, useMemo } from "react";

interface SearchSource {
  url: string;
  title: string;
  description?: string;
  content?: string;
  markdown?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
}

interface NewsResult {
  url: string;
  title: string;
  description?: string;
  publishedDate?: string;
  source?: string;
  image?: string;
}

interface ImageResult {
  url: string;
  title: string;
  thumbnail?: string;
  source?: string;
}

interface WebSearchResultsProps {
  sources: SearchSource[];
  newsResults: NewsResult[];
  imageResults: ImageResult[];
  answer: string;
  followUpQuestions: string[];
  searchStatus: string;
  isStreaming: boolean;
  onFollowUpClick: (question: string) => void;
}

function SourceCard({ source, index }: { source: SearchSource; index: number }) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-xl border border-black/5 hover:border-[#C48C56]/40 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm h-28 animate-fadeUp"
      style={{ animationDelay: `${index * 80}ms`, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {source.image && !imgError && (
        <div className="absolute inset-0">
          <img
            src={source.image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-white/90" />
      <div className="relative p-3 flex flex-col justify-between h-full">
        <div className="flex items-center gap-1.5">
          <div className="flex-shrink-0 w-4 h-4 bg-white rounded flex items-center justify-center overflow-hidden">
            {source.favicon && !faviconError ? (
              <img
                src={source.favicon}
                alt=""
                className="w-3 h-3 object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <svg className="w-2.5 h-2.5 text-[#8B7B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
          </div>
          <p className="text-[10px] text-[#2C2824]/60 truncate flex-1 font-medium">
            {source.siteName || (source.url ? new URL(source.url).hostname.replace("www.", "") : "")}
          </p>
          <span className="text-[9px] text-[#C48C56] font-semibold opacity-70">[{index + 1}]</span>
        </div>
        <h3 className="font-medium text-xs text-[#2C2824] line-clamp-2 group-hover:text-[#C48C56] leading-tight transition-colors">
          {source.title}
        </h3>
        <div className="flex items-center gap-1">
          <div className="h-1 flex-1 rounded-full bg-[#C48C56]/10 overflow-hidden">
            <div
              className="h-full bg-[#C48C56]/40 rounded-full animate-shimmer"
              style={{ width: `${Math.min(100, ((source.markdown?.length || source.content?.length || 0) / 50))}%` }}
            />
          </div>
          <span className="text-[9px] text-[#2C2824]/40">
            {((source.markdown?.length || source.content?.length || 0) / 1000).toFixed(1)}k chars
          </span>
        </div>
      </div>
    </a>
  );
}

function NewsCard({ result, index }: { result: NewsResult; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block flex-shrink-0 w-[260px] sm:w-auto animate-fadeUp"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-black/5 hover:border-[#C48C56]/30 transition-all duration-300 hover:shadow-md h-full">
        <div className="flex gap-3">
          {result.image && !imgError && (
            <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#F2EFEA]">
              <img
                src={result.image}
                alt={result.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-medium line-clamp-2 text-[#2C2824] group-hover:text-[#C48C56] mb-1 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {result.title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-[#2C2824]/50">
              {result.source && <span className="truncate">{result.source}</span>}
              {result.publishedDate && (() => {
                try {
                  const date = new Date(result.publishedDate);
                  if (isNaN(date.getTime())) return null;
                  return (
                    <span className="flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {date.toLocaleDateString()}
                    </span>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function ImageCard({ result, index, onClick }: { result: ImageResult; index: number; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  if (!result.thumbnail || imgError) return null;

  return (
    <div
      className="group block flex-shrink-0 w-[140px] sm:w-auto cursor-pointer animate-fadeUp"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F2EFEA] rounded-xl border border-black/5 hover:border-[#C48C56]/30 hover:shadow-md transition-all duration-300 h-full">
        <img
          src={result.thumbnail}
          alt={result.title || "Image"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-[10px] text-white line-clamp-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {result.title || "View image"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageModal({ imageUrl, title, onClose }: { imageUrl: string; title?: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] m-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
        <img src={imageUrl} alt={title || ""} className="max-w-full max-h-[85vh] object-contain rounded-xl" />
        {title && (
          <p className="text-center text-white/70 text-sm mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {title}
          </p>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content, sources }: { content: string; sources: SearchSource[] }) {
  const processedHtml = useMemo(() => {
    let html = content;
    // Convert markdown bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert markdown italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert markdown headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-[#2C2824]">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-5 mb-2 text-[#2C2824]">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-xl font-semibold mt-6 mb-3 text-[#2C2824]">$1</h1>');
    // Convert markdown links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#C48C56] hover:underline">$1</a>');
    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-[#2C2824]/5 rounded text-sm text-[#C48C56]">$1</code>');
    // Convert code blocks
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
      return `<pre class="bg-[#2C2824]/5 rounded-xl p-4 overflow-x-auto my-3"><code class="text-sm text-[#2C2824]">${code}</code></pre>`;
    });
    // Convert unordered lists
    html = html.replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-[#2C2824]/80">$1</li>');
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');
    // Convert ordered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-[#2C2824]/80">$1</li>');
    // Convert citations [1], [2] etc to clickable links
    html = html.replace(/\[(\d+)\]/g, (match, num) => {
      const idx = parseInt(num) - 1;
      const source = sources[idx];
      if (source) {
        return `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-[#C48C56]/15 text-[#C48C56] rounded-full hover:bg-[#C48C56]/30 transition-colors cursor-pointer no-underline align-super ml-0.5" title="${source.title}">${num}</a>`;
      }
      return match;
    });
    // Convert paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p class="mb-3 text-sm leading-relaxed text-[#2C2824]/80">');
    // Wrap in paragraph
    html = `<p class="mb-3 text-sm leading-relaxed text-[#2C2824]/80">${html}</p>`;
    // Clean up empty paragraphs
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
    return html;
  }, [content, sources]);

  return (
    <div
      className="prose-maplier"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white/40 backdrop-blur-sm border border-black/5 animate-pulse">
            <div className="p-3 space-y-2">
              <div className="h-2 bg-[#2C2824]/10 rounded w-2/3" />
              <div className="h-2 bg-[#2C2824]/10 rounded w-full" />
              <div className="h-2 bg-[#2C2824]/10 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-[#2C2824]/10 rounded w-full animate-pulse" />
        <div className="h-3 bg-[#2C2824]/10 rounded w-5/6 animate-pulse" style={{ animationDelay: "100ms" }} />
        <div className="h-3 bg-[#2C2824]/10 rounded w-4/5 animate-pulse" style={{ animationDelay: "200ms" }} />
      </div>
    </div>
  );
}

export default function WebSearchResults({
  sources,
  newsResults,
  imageResults,
  answer,
  followUpQuestions,
  searchStatus,
  isStreaming,
  onFollowUpClick,
}: WebSearchResultsProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title?: string } | null>(null);

  const handleFollowUp = useCallback(
    (question: string) => {
      onFollowUpClick(question);
    },
    [onFollowUpClick]
  );

  // Show skeleton while waiting for sources
  if (isStreaming && sources.length === 0 && !answer) {
    return (
      <div className="w-full">
        {searchStatus && (
          <div className="flex items-center gap-2 mb-4 text-sm text-[#2C2824]/50">
            <svg className="w-4 h-4 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{searchStatus}</span>
          </div>
        )}
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="animate-fadeUp">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
            <h2 className="text-xs font-medium text-[#2C2824]/60 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Sources
            </h2>
            {sources.length > 5 && (
              <span className="text-[10px] text-[#2C2824]/40 ml-auto">+{sources.length - 5} more</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {sources.slice(0, 5).map((source, idx) => (
              <SourceCard key={idx} source={source} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Images Section */}
      {imageResults.length > 0 && (
        <div className="animate-fadeUp" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <h2 className="text-xs font-medium text-[#2C2824]/60 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Images
            </h2>
          </div>
          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-6 overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {imageResults.slice(0, 6).map((result, idx) => (
              <ImageCard
                key={idx}
                result={result}
                index={idx}
                onClick={() => setSelectedImage({ url: result.thumbnail || "", title: result.title })}
              />
            ))}
          </div>
        </div>
      )}

      {/* News Section */}
      {newsResults.length > 0 && (
        <div className="animate-fadeUp" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
            </svg>
            <h2 className="text-xs font-medium text-[#2C2824]/60 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              News
            </h2>
          </div>
          <div className="sm:space-y-2 sm:block flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {newsResults.slice(0, 4).map((result, idx) => (
              <NewsCard key={idx} result={result} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Answer Section */}
      {answer && (
        <div className="animate-fadeUp" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <h2 className="text-xs font-medium text-[#2C2824]/60 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Answer
            </h2>
          </div>
          <div className="card-flashlight bg-white/60 backdrop-blur-sm p-5 rounded-2xl">
            <MarkdownContent content={answer} sources={sources} />
            {isStreaming && (
              <span className="inline-flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 bg-[#C48C56] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#C48C56] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#C48C56] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && !isStreaming && (
        <div className="animate-fadeUp" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <h2 className="text-xs font-medium text-[#2C2824]/60 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Related
            </h2>
          </div>
          <div className="space-y-2">
            {followUpQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleFollowUp(question)}
                className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-black/5 hover:border-[#C48C56]/30 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#2C2824]/30 group-hover:text-[#C48C56] flex-shrink-0 mt-0.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  <span
                    className="text-sm text-[#2C2824]/70 group-hover:text-[#C48C56] transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {question}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
