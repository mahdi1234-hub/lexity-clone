"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";

interface DashboardData {
  stats: {
    totalMessages: number;
    totalConversations: number;
    totalFiles: number;
    totalReports: number;
    messagesToday: number;
    messagesThisWeek: number;
    messagesThisMonth: number;
    recentActivities: Array<{
      id: string;
      type: string;
      metadata: string | null;
      createdAt: string;
    }>;
  };
  dailyMessages: Array<{ date: string; count: number }>;
  recentConversations: Array<{
    id: string;
    title: string | null;
    updatedAt: string;
    _count: { messages: number };
  }>;
  recentFiles: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
  }>;
  user: {
    name: string;
    email: string;
    image: string;
  };
}

const activityLabels: Record<string, string> = {
  message_sent: "Message Sent",
  file_uploaded: "File Uploaded",
  conversation_created: "Conversation Created",
  report_generated: "Report Generated",
  collaboration_joined: "Collaboration Joined",
  login: "Login",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchDashboard();
  }, [session]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/dashboard/report-pdf");
      if (!res.ok) throw new Error("Failed to generate report");
      const reportData = await res.json();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(44, 40, 36);
      doc.text("Activity Report", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, pageWidth / 2, y, { align: "center" });
      y += 5;
      doc.text(`User: ${reportData.user.name} (${reportData.user.email})`, pageWidth / 2, y, { align: "center" });
      y += 15;

      // Stats summary
      doc.setFontSize(14);
      doc.setTextColor(44, 40, 36);
      doc.text("Summary", 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const statsLines = [
        `Total Messages: ${reportData.stats.totalMessages}`,
        `Total Conversations: ${reportData.stats.totalConversations}`,
        `Total Files Uploaded: ${reportData.stats.totalFiles}`,
        `Total Reports: ${reportData.stats.totalReports}`,
        `Messages Today: ${reportData.stats.messagesToday}`,
        `Messages This Week: ${reportData.stats.messagesThisWeek}`,
        `Messages This Month: ${reportData.stats.messagesThisMonth}`,
      ];
      statsLines.forEach((line) => {
        doc.text(line, 25, y);
        y += 6;
      });
      y += 8;

      // Conversations
      if (reportData.conversations.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(44, 40, 36);
        doc.text("Conversations", 20, y);
        y += 8;

        doc.setFontSize(9);
        reportData.conversations.forEach((conv: { title: string; messageCount: number; lastMessage: string }) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setTextColor(44, 40, 36);
          doc.text(`${conv.title} (${conv.messageCount} messages)`, 25, y);
          y += 5;
          if (conv.lastMessage) {
            doc.setTextColor(120, 120, 120);
            doc.text(`Last: ${conv.lastMessage.substring(0, 80)}...`, 30, y);
            y += 5;
          }
          y += 3;
        });
        y += 5;
      }

      // Files
      if (reportData.files.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(44, 40, 36);
        doc.text("Uploaded Files", 20, y);
        y += 8;

        doc.setFontSize(9);
        reportData.files.forEach((file: { filename: string; mimeType: string; size: number; uploadedAt: string }) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setTextColor(44, 40, 36);
          doc.text(`${file.filename} (${formatBytes(file.size)})`, 25, y);
          y += 5;
          doc.setTextColor(120, 120, 120);
          doc.text(`Type: ${file.mimeType} | Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}`, 30, y);
          y += 7;
        });
        y += 5;
      }

      // Activity breakdown
      if (reportData.activityBreakdown.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(44, 40, 36);
        doc.text("Activity Breakdown", 20, y);
        y += 8;

        doc.setFontSize(10);
        reportData.activityBreakdown.forEach((a: { type: string; count: number }) => {
          doc.setTextColor(80, 80, 80);
          doc.text(`${activityLabels[a.type] || a.type}: ${a.count}`, 25, y);
          y += 6;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: "center" });
      }

      doc.save(`activity-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setGeneratingPdf(false);
    }
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <div className="text-[#C48C56]">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/chat")}
              className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1
              className="text-xl font-light text-[#2C2824]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-[#C48C56] text-white rounded-xl text-sm font-medium hover:bg-[#B07A48] transition-colors disabled:opacity-50"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-6M9 15l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {generatingPdf ? "Generating..." : "Export PDF Report"}
            </button>
            {data?.user?.image && (
              <img src={data.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Messages", value: data?.stats.totalMessages || 0, icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
            { label: "Conversations", value: data?.stats.totalConversations || 0, icon: "M19 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" },
            { label: "Files Uploaded", value: data?.stats.totalFiles || 0, icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
            { label: "Reports", value: data?.stats.totalReports || 0, icon: "M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zM5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#C48C56]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={stat.icon} />
                  </svg>
                </div>
              </div>
              <p
                className="text-2xl font-semibold text-[#2C2824]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs text-[#2C2824]/50 mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Message frequency cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Today", value: data?.stats.messagesToday || 0 },
            { label: "This Week", value: data?.stats.messagesThisWeek || 0 },
            { label: "This Month", value: data?.stats.messagesThisMonth || 0 },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-4 text-center"
            >
              <p
                className="text-3xl font-bold text-[#C48C56]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {item.value}
              </p>
              <p
                className="text-xs text-[#2C2824]/50 mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Messages {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Daily chart */}
        {data?.dailyMessages && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-6 mb-8">
            <h2
              className="text-sm font-medium text-[#2C2824]/70 mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Messages - Last 7 Days
            </h2>
            <div className="flex items-end gap-2 h-32">
              {data.dailyMessages.map((day) => {
                const maxCount = Math.max(...data.dailyMessages.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#2C2824]/40">{day.count}</span>
                    <div
                      className="w-full bg-[#C48C56]/20 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      <div
                        className="w-full h-full bg-[#C48C56] rounded-t-lg"
                        style={{ opacity: 0.6 + (height / 100) * 0.4 }}
                      />
                    </div>
                    <span className="text-[9px] text-[#2C2824]/30">
                      {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Conversations */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-6">
            <h2
              className="text-sm font-medium text-[#2C2824]/70 mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Recent Conversations
            </h2>
            {(!data?.recentConversations || data.recentConversations.length === 0) ? (
              <p className="text-xs text-[#2C2824]/30 text-center py-6">No conversations yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-colors cursor-pointer"
                    onClick={() => router.push("/chat")}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium text-[#2C2824] truncate"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {conv.title || "Untitled"}
                      </p>
                      <p className="text-[10px] text-[#2C2824]/40">
                        {conv._count.messages} messages
                      </p>
                    </div>
                    <span className="text-[10px] text-[#2C2824]/30 flex-shrink-0 ml-2">
                      {formatTimeAgo(conv.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-6">
            <h2
              className="text-sm font-medium text-[#2C2824]/70 mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Recent Activity
            </h2>
            {(!data?.stats.recentActivities || data.stats.recentActivities.length === 0) ? (
              <p className="text-xs text-[#2C2824]/30 text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {data.stats.recentActivities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#C48C56]/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs text-[#2C2824]/70"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {activityLabels[activity.type] || activity.type}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#2C2824]/30 flex-shrink-0">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Files */}
        {data?.recentFiles && data.recentFiles.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-black/5 p-6">
            <h2
              className="text-sm font-medium text-[#2C2824]/70 mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Recent Files
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#C48C56]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-medium text-[#2C2824] truncate"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {file.filename}
                    </p>
                    <p className="text-[10px] text-[#2C2824]/40">
                      {formatBytes(file.size)} &middot; {formatTimeAgo(file.createdAt)}
                    </p>
                  </div>
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C48C56] hover:text-[#B07A48] flex-shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
