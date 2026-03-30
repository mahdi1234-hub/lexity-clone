"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const FN = "'Plus Jakarta Sans', sans-serif";

// Background images for different themes
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80",
  "https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
];

export interface PDFSection {
  heading?: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export interface PDFPageData {
  pageTitle?: string;
  sections: PDFSection[];
}

export interface BrandedPDFData {
  title: string;
  subtitle?: string;
  description: string;
  pages: PDFPageData[];
  keywords?: string[];
  backgroundImage?: string;
  accentColor?: string;
}

interface BrandedPDFViewerProps {
  data: BrandedPDFData;
  onDelete?: () => void;
}

export default function BrandedPDFViewer({ data, onDelete }: BrandedPDFViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfSize, setPdfSize] = useState("");

  const totalPages = Math.min(data.pages.length, 4);
  const accent = data.accentColor || "#C48C56";
  const bgImage = data.backgroundImage || BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Estimate PDF size
  useEffect(() => {
    const textLength = JSON.stringify(data).length;
    const estimatedKB = Math.round((textLength * 2.5 + totalPages * 50000) / 1024);
    setPdfSize(`~${estimatedKB} kB`);
  }, [data, totalPages]);

  const handleDownloadPDF = useCallback(async () => {
    if (!contentRef.current || isGenerating) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < totalPages; i++) {
        setCurrentPage(i);
        // Wait for render
        await new Promise((r) => setTimeout(r, 300));

        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: contentRef.current.scrollWidth,
          height: contentRef.current.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      }

      pdf.save(`${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setCurrentPage(0);
      setIsGenerating(false);
    }
  }, [data, totalPages, isGenerating]);

  const handleCopy = useCallback(() => {
    const allText = data.pages
      .map((page, i) => {
        const pageText = [`--- Page ${i + 1} ---`];
        if (page.pageTitle) pageText.push(`\n${page.pageTitle}\n`);
        page.sections.forEach((s) => {
          if (s.heading) pageText.push(`\n## ${s.heading}\n`);
          pageText.push(s.body);
        });
        return pageText.join("\n");
      })
      .join("\n\n");

    const fullText = `${data.title}\n${data.subtitle || ""}\n\n${data.description}\n\n${allText}\n\nGenerated: ${generatedAt}\nMade With Love By Louati Mahdi`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data, generatedAt]);

  const currentPageData = data.pages[currentPage];

  return (
    <div className="w-full max-w-[95%] mt-3">
      {/* Toolbar - matching the screenshot */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-t-2xl border border-b-0 border-black/5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-sm font-medium text-[#2C2824]/70 truncate"
            style={{ fontFamily: FN }}
          >
            {data.title}
            {data.subtitle ? `: ${data.subtitle}` : ""}
          </span>
          <span className="text-xs text-[#2C2824]/40 flex-shrink-0">{pdfSize}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          {/* Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors text-[#2C2824]/50 hover:text-[#2C2824]/80"
            title="Download PDF"
          >
            {isGenerating ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors text-[#2C2824]/50 hover:text-[#2C2824]/80"
            title={copied ? "Copied!" : "Copy content"}
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          {/* Delete */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[#2C2824]/50 hover:text-red-500"
              title="Remove"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* PDF Content Preview */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-black/5 overflow-hidden shadow-sm">
        <div
          ref={contentRef}
          className="relative overflow-hidden"
          style={{ fontFamily: FN, minHeight: 480 }}
        >
          {/* Cover Page (page 0) */}
          {currentPage === 0 && (
            <div className="relative" style={{ minHeight: 480 }}>
              {/* Hero background image */}
              <div className="absolute inset-0">
                <img
                  src={bgImage}
                  alt="Background"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
              </div>

              {/* Content overlay */}
              <div className="relative z-10 px-10 pt-16 pb-10 flex flex-col justify-end" style={{ minHeight: 480 }}>
                {/* Title */}
                <h1
                  className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Georgia', serif" }}
                >
                  {data.title}
                </h1>
                {data.subtitle && (
                  <h2
                    className="text-2xl md:text-3xl font-light mb-6"
                    style={{ color: accent, fontFamily: FN }}
                  >
                    {data.subtitle}
                  </h2>
                )}
                <p
                  className="text-white/80 text-sm leading-relaxed max-w-lg mb-8"
                  style={{ fontFamily: FN }}
                >
                  {data.description}
                </p>

                {/* Metadata bar */}
                <div className="flex items-center gap-4 text-white/50 text-[10px] uppercase tracking-widest">
                  <span>{generatedAt}</span>
                  <span className="w-4 h-px bg-white/30" />
                  <span>{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content Pages (page 1+) */}
          {currentPage > 0 && currentPageData && (
            <div className="px-10 py-10" style={{ minHeight: 480 }}>
              {/* Page header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: `${accent}30` }}>
                <div>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
                    {data.title}
                  </span>
                  {currentPageData.pageTitle && (
                    <h3 className="text-xl font-semibold text-[#1c1917] mt-1">
                      {currentPageData.pageTitle}
                    </h3>
                  )}
                </div>
                <span className="text-xs text-[#2C2824]/30">
                  Page {currentPage + 1} of {totalPages}
                </span>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {currentPageData.sections.map((section, idx) => (
                  <div key={idx}>
                    {section.heading && (
                      <h4
                        className="text-lg font-semibold text-[#1c1917] mb-2 flex items-center gap-2"
                      >
                        <span
                          className="w-1 h-5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        {section.heading}
                      </h4>
                    )}
                    <p className="text-sm text-[#2C2824]/80 leading-relaxed whitespace-pre-wrap">
                      {section.body}
                    </p>
                    {section.image && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-black/5">
                        <img
                          src={section.image}
                          alt={section.imageAlt || "Section image"}
                          className="w-full h-48 object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-[10px] text-[#2C2824]/30">
                <span>{generatedAt}</span>
                <span style={{ fontFamily: FN }}>Made With Love By Louati Mahdi</span>
              </div>
            </div>
          )}
        </div>

        {/* Page navigation / scrollbar */}
        <div className="px-4 py-2 bg-[#1c1917] flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                currentPage === i ? "bg-white" : "bg-white/20 hover:bg-white/40"
              }`}
              title={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Description + Tags below the viewer */}
      <div className="mt-2 px-1">
        <p
          className="text-xs text-[#2C2824]/50 leading-relaxed mb-2"
          style={{ fontFamily: FN }}
        >
          {data.description}
        </p>
        {data.keywords && data.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2C2824]/5 text-[10px] text-[#2C2824]/60"
                style={{ fontFamily: FN }}
              >
                {kw}
                <svg className="w-2.5 h-2.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
