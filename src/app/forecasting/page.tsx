"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const ForecastChart = dynamic(() => import("@/components/forecasting/ForecastChart"), { ssr: false });
const FrappeChartWrapper = dynamic(() => import("@/components/forecasting/FrappeChartWrapper"), { ssr: false });
const InlineChatForm = dynamic(() => import("@/components/forecasting/InlineChatForm"), { ssr: false });

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: any;
  suggestions?: string[];
  timestamp: Date;
}

export default function ForecastingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cursor tracking
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [smoothCursor, setSmoothCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setSmoothCursor((prev) => ({
        x: prev.x + (cursorPos.x - prev.x) * 0.15,
        y: prev.y + (cursorPos.y - prev.y) * 0.15,
      }));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [cursorPos]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the Forecasting Intelligence workspace. I am your time series analysis and decision-making companion. Upload your data or describe what you would like to forecast, and I will guide you through a comprehensive analytical journey -- from understanding your data to generating actionable predictions with confidence intervals.",
      action: { type: "request_upload", formats: ["json", "csv"] },
      suggestions: [
        "I have time series data to analyze",
        "Generate sample data to explore",
        "What forecasting methods do you support?",
      ],
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const apiMessages = messages
          .filter((m) => m.id !== "welcome")
          .concat(userMessage)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const res = await fetch("/api/forecasting-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message || data.error || "I encountered an issue processing your request.",
          action: data.action || null,
          suggestions: data.suggestions || [],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I apologize, but I encountered a connection issue. Please try again in a moment.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      let parsed: any = null;

      try {
        if (file.name.endsWith(".json")) {
          parsed = JSON.parse(text);
        } else if (file.name.endsWith(".csv")) {
          // Simple CSV parse
          const lines = text.split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim());
          const data = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const row: any = {};
            headers.forEach((h, i) => {
              row[h] = values[i];
            });
            return row;
          });
          parsed = { data, columns: headers };
        }
      } catch (err) {
        console.error("Parse error:", err);
      }

      if (parsed) {
        setUploadedData(parsed);
        const dataStr = JSON.stringify(
          Array.isArray(parsed) ? parsed.slice(0, 10) : parsed.data ? parsed.data.slice(0, 10) : parsed,
          null,
          2
        );
        await sendMessage(
          `I have uploaded a ${file.name.endsWith(".json") ? "JSON" : "CSV"} file named "${file.name}". Here is a preview of the data (first 10 rows):\n\n${dataStr}\n\nPlease analyze this data and guide me through the process.`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleFormSubmit = async (formId: string, data: Record<string, any>) => {
    await sendMessage(
      `I have configured the ${formId.replace(/_/g, " ")} with these settings: ${JSON.stringify(data, null, 2)}`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const renderAction = (action: any) => {
    if (!action) return null;

    switch (action.type) {
      case "request_upload":
        return (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-xs tracking-[0.12em] uppercase hover:bg-white/[0.1] hover:border-[#78c8b4]/30 hover:text-[#78c8b4] transition-all duration-300"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Upload Data
            </button>
            <span className="text-xs text-white/30" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Supported: {action.formats?.join(", ") || "JSON, CSV"}
            </span>
          </div>
        );

      case "show_form":
        return (
          <InlineChatForm
            formId={action.form_id}
            fields={action.fields || []}
            onSubmit={handleFormSubmit}
            title={action.form_id?.replace(/_/g, " ")}
          />
        );

      case "show_chart":
        return renderChart(action);

      case "show_analytics":
        return renderAnalytics(action.analytics);

      default:
        return null;
    }
  };

  const renderChart = (action: any) => {
    const { chart_type, data } = action;

    if (!data) return null;

    // For forecast/timeseries type, use D3 ForecastChart
    if (
      chart_type === "forecast" ||
      chart_type === "timeseries" ||
      chart_type === "decomposition"
    ) {
      return (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-hidden">
          <ForecastChart
            labels={data.labels || []}
            datasets={
              data.datasets?.map((ds: any) => ({
                name: ds.name,
                values: ds.values,
                type: ds.type || "actual",
              })) || []
            }
            confidence={data.confidence}
            title={
              chart_type === "forecast"
                ? "Forecast with Confidence Intervals"
                : chart_type === "decomposition"
                ? "Time Series Decomposition"
                : "Time Series Visualization"
            }
          />
        </div>
      );
    }

    // For bar, line, heatmap, pie - use Frappe Charts
    return (
      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-hidden">
        <FrappeChartWrapper
          title={data.title || chart_type}
          type={chart_type === "heatmap" ? "heatmap" : chart_type === "bar" ? "bar" : "line"}
          labels={data.labels || []}
          datasets={
            data.datasets?.map((ds: any) => ({
              name: ds.name,
              values: ds.values,
            })) || []
          }
          colors={["#78c8b4", "#e8a87c", "#d4a5a5", "#8cc0de", "#c9b1ff"]}
          lineOptions={{ dotSize: 4, regionFill: 1, hideDots: false }}
        />
      </div>
    );
  };

  const renderAnalytics = (analytics: any) => {
    if (!analytics) return null;

    return (
      <div className="mt-3 space-y-3">
        {analytics.summary && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h5
              className="text-xs tracking-[0.12em] uppercase text-white/40 mb-3"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              Data Summary
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(analytics.summary).map(([key, value]) => (
                <div key={key} className="text-center p-2">
                  <div
                    className="text-2xl font-light text-white/80"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {typeof value === "number" ? (value as number).toFixed(2) : String(value)}
                  </div>
                  <div className="text-[10px] text-white/30 tracking-wider uppercase mt-1">
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.stationarity && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h5
              className="text-xs tracking-[0.12em] uppercase text-white/40 mb-3"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              Stationarity Analysis
            </h5>
            <div className="space-y-2">
              {Object.entries(analytics.stationarity).map(([test, result]: [string, any]) => (
                <div key={test} className="flex items-center justify-between text-sm">
                  <span className="text-white/50" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {test}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      result?.stationary
                        ? "bg-[#78c8b4]/15 text-[#78c8b4]"
                        : "bg-[#e8a87c]/15 text-[#e8a87c]"
                    }`}
                  >
                    {result?.stationary ? "Stationary" : "Non-stationary"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.metrics && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h5
              className="text-xs tracking-[0.12em] uppercase text-white/40 mb-3"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              Model Performance
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th
                      className="text-left py-2 text-white/40 text-xs font-normal"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Model
                    </th>
                    {analytics.metrics[Object.keys(analytics.metrics)[0]] &&
                      Object.keys(analytics.metrics[Object.keys(analytics.metrics)[0]]).map(
                        (metric: string) => (
                          <th
                            key={metric}
                            className="text-right py-2 text-white/40 text-xs font-normal"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                          >
                            {metric.toUpperCase()}
                          </th>
                        )
                      )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.metrics).map(([model, metrics]: [string, any]) => (
                    <tr key={model} className="border-b border-white/[0.03]">
                      <td
                        className="py-2 text-white/60"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {model}
                      </td>
                      {Object.values(metrics).map((val: any, idx: number) => (
                        <td
                          key={idx}
                          className="text-right py-2 text-white/50 tabular-nums"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {typeof val === "number" ? val.toFixed(4) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative min-h-screen text-white selection:bg-white selection:text-black overflow-hidden"
      style={{
        backgroundColor: "#1a1c1a",
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      {/* Background layers */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2674&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9) contrast(1.1)",
        }}
      />
      <div
        className="fixed inset-0 z-[1]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2674&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(25px) grayscale(0.4) brightness(0.9)",
          transform: "scale(1.05)",
          maskImage: `radial-gradient(circle 250px at ${smoothCursor.x}px ${smoothCursor.y}px, transparent 0%, rgba(0,0,0,0.5) 40%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle 250px at ${smoothCursor.x}px ${smoothCursor.y}px, transparent 0%, rgba(0,0,0,0.5) 40%, black 100%)`,
        }}
      />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 z-[2] opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Custom cursors */}
      <div
        className="fixed pointer-events-none z-[100] w-[4px] h-[4px] bg-white rounded-full"
        style={{
          transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) translate(-50%, -50%)`,
        }}
      />
      <div
        className="fixed pointer-events-none z-[99] w-[40px] h-[40px] border border-white/40 rounded-full"
        style={{
          transform: `translate(${smoothCursor.x}px, ${smoothCursor.y}px) translate(-50%, -50%)`,
          mixBlendMode: "difference",
          transition: "width 0.3s, height 0.3s",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 md:px-10 py-6">
          <a href="/" className="group flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full group-hover:scale-150 transition-transform duration-500" />
            <span
              className="text-xs tracking-[0.3em] font-bold text-white/90"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              FORECASTING
            </span>
          </a>

          <div className="flex items-center gap-6">
            <div
              className="text-[0.6rem] tracking-widest text-white/50 flex gap-4"
              style={{ fontFamily: "'Syncopate', sans-serif" }}
            >
              <span>AI ANALYST</span>
              <span className="text-[#78c8b4]">ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 pb-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-white/[0.08] border-white/[0.08]"
                      : "bg-white/[0.03] border-white/[0.05]"
                  } border rounded-2xl px-5 py-4 backdrop-blur-sm`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#78c8b4] animate-pulse" />
                      <span
                        className="text-[0.55rem] tracking-[0.2em] uppercase text-white/30"
                        style={{ fontFamily: "'Syncopate', sans-serif" }}
                      >
                        Analyst
                      </span>
                    </div>
                  )}

                  <div
                    className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "15px",
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Render actions (forms, charts, upload buttons) */}
                  {msg.action && renderAction(msg.action)}

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(suggestion)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.08] hover:text-white/70 hover:border-white/15 transition-all duration-300 disabled:opacity-30"
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "12px",
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className="mt-2 text-[10px] text-white/15"
                    style={{ fontFamily: "'Syncopate', sans-serif" }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#78c8b4] animate-pulse" />
                    <span
                      className="text-[0.55rem] tracking-[0.2em] uppercase text-white/30"
                      style={{ fontFamily: "'Syncopate', sans-serif" }}
                    >
                      Analyst
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span
                      className="text-xs text-white/20 italic"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] bg-[#1a1c1a]/80 backdrop-blur-xl px-4 md:px-8 lg:px-16 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              {/* File upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-[#78c8b4] hover:border-[#78c8b4]/30 hover:bg-[#78c8b4]/5 transition-all duration-300"
                title="Upload data file"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your forecasting needs..."
                  rows={1}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#78c8b4]/30 focus:ring-1 focus:ring-[#78c8b4]/10 transition-all resize-none"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "15px",
                    minHeight: "48px",
                    maxHeight: "120px",
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-[#78c8b4] hover:border-[#78c8b4]/30 hover:bg-[#78c8b4]/10 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p
                className="text-[0.55rem] tracking-[0.15em] text-white/15 uppercase"
                style={{ fontFamily: "'Syncopate', sans-serif" }}
              >
                Time Series Intelligence
              </p>
              <p
                className="text-[10px] text-white/15"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Fonts */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Syncopate:wght@400;700&display=swap");

        .forecasting-page * {
          cursor: none !important;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
