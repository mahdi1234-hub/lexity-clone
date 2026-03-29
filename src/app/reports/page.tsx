"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const FN = "'Plus Jakarta Sans', sans-serif";

interface ReportListing {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  fileSize: number;
  thumbnailData?: string;
  chartCount: number;
  rowCount: number;
  columnCount: number;
  dataSource: string;
}

interface ReportFull extends ReportListing {
  pdfData: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ReportListing[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<ReportFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedTag) params.set("tag", selectedTag);
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setAllTags(data.tags || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag]);

  useEffect(() => {
    if (session) fetchReports();
  }, [session, fetchReports]);

  const viewReport = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (data.report) setViewingReport(data.report);
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setViewLoading(false);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (viewingReport?.id === id) setViewingReport(null);
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  const downloadReport = (report: ReportFull) => {
    const link = document.createElement("a");
    link.href = report.pdfData;
    link.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    link.click();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // ========== REPORT VIEWER ==========
  if (viewingReport) {
    return (
      <div className="min-h-screen bg-[#F2EFEA]">
        {/* Top bar */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-black/5">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setViewingReport(null)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-medium text-[#2C2824] truncate" style={{ fontFamily: FN }}>
                {viewingReport.title}
              </h1>
              <p className="text-[10px] text-[#2C2824]/40" style={{ fontFamily: FN }}>
                {formatSize(viewingReport.fileSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadReport(viewingReport)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="Download">
              <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={() => navigator.clipboard.writeText(viewingReport.pdfData)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" title="Copy">
              <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button onClick={() => deleteReport(viewingReport.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Report content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Title card like screenshot */}
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden mb-6 shadow-sm">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-[#2C2824] mb-2" style={{ fontFamily: FN }}>
                {viewingReport.title}
              </h1>
              <p className="text-lg text-[#C48C56] font-light" style={{ fontFamily: FN }}>
                Exploratory Data Analysis
              </p>
              <p className="text-sm text-[#2C2824]/60 mt-4 leading-relaxed" style={{ fontFamily: FN }}>
                {viewingReport.description}
              </p>
            </div>

            {/* PDF embed */}
            {viewingReport.pdfData && (
              <div className="border-t border-black/5">
                <iframe
                  src={viewingReport.pdfData}
                  className="w-full"
                  style={{ height: "70vh" }}
                  title="Report PDF"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-black/5 p-6 mb-4 shadow-sm">
            <p className="text-sm text-[#2C2824]/70 leading-relaxed" style={{ fontFamily: FN }}>
              {viewingReport.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {viewingReport.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full border border-[#2C2824]/10 text-[#2C2824]/60 bg-white"
                style={{ fontFamily: FN }}
              >
                {tag} &times;
              </span>
            ))}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Charts", value: String(viewingReport.chartCount) },
              { label: "Rows", value: viewingReport.rowCount.toLocaleString() },
              { label: "Columns", value: String(viewingReport.columnCount) },
              { label: "Generated", value: formatDate(viewingReport.createdAt) },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-black/5 p-3 text-center shadow-sm">
                <p className="text-[9px] text-[#2C2824]/40 uppercase tracking-widest font-semibold" style={{ fontFamily: FN }}>{m.label}</p>
                <p className="text-sm font-bold text-[#C48C56] mt-0.5" style={{ fontFamily: FN }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========== REPORTS LIST / WORKSPACE ==========
  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/chat")} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-lg font-medium text-[#2C2824]" style={{ fontFamily: FN }}>My Reports</h1>
            </div>
            <span className="text-xs text-[#2C2824]/40" style={{ fontFamily: FN }}>
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C2824]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F2EFEA] rounded-xl text-sm text-[#2C2824] placeholder-[#2C2824]/30 focus:outline-none focus:ring-1 focus:ring-[#C48C56]/30 border border-transparent focus:border-[#C48C56]/20"
              style={{ fontFamily: FN }}
            />
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5 transition-colors"
            >
              <svg className="w-4 h-4 text-[#2C2824]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            {/* Date filter */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-black/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#2C2824]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-xs text-[#2C2824]/60" style={{ fontFamily: FN }}>Date</span>
              </div>
              <svg className={`w-3 h-3 text-[#2C2824]/30 transition-transform ${showDateFilter ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Tags filter */}
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-black/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#2C2824]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="text-xs text-[#2C2824]/60" style={{ fontFamily: FN }}>Tags</span>
              </div>
              <svg className={`w-3 h-3 text-[#2C2824]/30 transition-transform ${showTagFilter ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {showTagFilter && allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${
                    !selectedTag ? "bg-[#C48C56] text-white" : "bg-[#2C2824]/5 text-[#2C2824]/50 hover:bg-[#2C2824]/10"
                  }`}
                  style={{ fontFamily: FN }}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${
                      selectedTag === tag ? "bg-[#C48C56] text-white" : "bg-[#2C2824]/5 text-[#2C2824]/50 hover:bg-[#2C2824]/10"
                    }`}
                    style={{ fontFamily: FN }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#C48C56]/10 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#C48C56]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[#2C2824]/60 mb-1" style={{ fontFamily: FN }}>No reports yet</h3>
            <p className="text-xs text-[#2C2824]/30" style={{ fontFamily: FN }}>
              Upload a CSV file in Chat and use the EDA Dashboard to generate your first report.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 px-4 py-2 bg-[#C48C56] text-white text-xs rounded-xl hover:bg-[#B07A48] transition-colors"
              style={{ fontFamily: FN }}
            >
              Go to Chat
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => viewReport(report.id)}
                className="group bg-white rounded-2xl border border-black/5 p-4 cursor-pointer hover:shadow-md hover:border-[#C48C56]/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-[#F2EFEA] flex-shrink-0 overflow-hidden border border-black/5">
                    {report.thumbnailData ? (
                      <img src={report.thumbnailData} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#C48C56]/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#2C2824] truncate group-hover:text-[#C48C56] transition-colors" style={{ fontFamily: FN }}>
                      {report.title}
                    </h3>
                    <p className="text-xs text-[#2C2824]/40 mt-1 line-clamp-2" style={{ fontFamily: FN }}>
                      {report.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {report.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] rounded-full border border-[#2C2824]/10 text-[#2C2824]/50"
                          style={{ fontFamily: FN }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-[#2C2824]/30" style={{ fontFamily: FN }}>
                      {formatDate(report.createdAt)}
                    </p>
                    <p className="text-[10px] text-[#2C2824]/20 mt-0.5" style={{ fontFamily: FN }}>
                      {formatSize(report.fileSize)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
