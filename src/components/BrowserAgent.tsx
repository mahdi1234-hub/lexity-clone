"use client";

import { useState, useRef, useCallback } from "react";

interface AgentStep {
  type: string;
  description: string;
  url?: string;
  data?: unknown;
  timestamp: string;
}

interface BrowserAgentProps {
  onClose: () => void;
}

const stepIcons: Record<string, string> = {
  think: "🧠",
  navigate: "🌐",
  act: "⚡",
  extract: "📋",
  observe: "👁",
  complete: "✅",
  error: "❌",
};

const stepColors: Record<string, string> = {
  think: "text-[#9575CD]",
  navigate: "text-[#64B5F6]",
  act: "text-[#FFB74D]",
  extract: "text-[#81C784]",
  observe: "text-[#4FC3F7]",
  complete: "text-[#6B8E6B]",
  error: "text-red-400",
};

export default function BrowserAgent({ onClose }: BrowserAgentProps) {
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const runAgent = async () => {
    if (!task.trim() || isRunning) return;

    setIsRunning(true);
    setSteps([]);
    setIsComplete(false);
    setError(null);

    try {
      const res = await fetch("/api/browser-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setRateLimited(true);
        setError(data.message);
        setIsRunning(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to start browser agent");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsComplete(true);
              break;
            }
            try {
              const step = JSON.parse(data) as AgentStep;
              setSteps((prev) => [...prev, step]);
              setTimeout(scrollToBottom, 100);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
      setIsComplete(true);
    }
  };

  const formatData = (data: unknown): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#1A1714] rounded-2xl border border-[#3D3530] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3D3530]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C48C56] to-[#8B6B3D] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2
                className="text-sm font-medium text-[#F2EFEA]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Browser Automation Agent
              </h2>
              <p className="text-[10px] text-[#F2EFEA]/30">
                Powered by Stagehand + Groq AI {!rateLimited ? "| 1 use/day" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 hover:bg-[#2C2824] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Task Input */}
        {!isRunning && !isComplete && !rateLimited && (
          <div className="px-5 py-4 border-b border-[#3D3530]">
            <p
              className="text-xs text-[#F2EFEA]/50 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Describe what you want the agent to do. It can research topics, navigate websites, interact with web apps, extract data, and execute multi-step workflows.
            </p>
            <div className="flex gap-2">
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    runAgent();
                  }
                }}
                placeholder='e.g. "Research the latest AI developments and summarize key trends" or "Go to GitHub and find the most starred Python projects"'
                rows={3}
                className="flex-1 bg-[#2C2824] border border-[#3D3530] rounded-xl px-3 py-2.5 text-sm text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none focus:border-[#C48C56]/40 resize-none"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Research AI trends",
                  "Search for Next.js tutorials",
                  "Extract data from Wikipedia",
                  "Find top GitHub repos",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setTask(suggestion)}
                    className="px-2.5 py-1 text-[10px] text-[#F2EFEA]/40 bg-[#2C2824] hover:bg-[#3D3530] rounded-lg transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <button
                onClick={runAgent}
                disabled={!task.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#C48C56] to-[#8B6B3D] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Run Agent
              </button>
            </div>
          </div>
        )}

        {/* Rate Limited Message */}
        {rateLimited && (
          <div className="px-5 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p
              className="text-sm text-red-400 font-medium"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Daily Limit Reached
            </p>
            <p
              className="text-xs text-[#F2EFEA]/30 mt-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {error || "Browser agent is limited to 1 use per day. Try again tomorrow."}
            </p>
          </div>
        )}

        {/* Steps Progress */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
          {isRunning && steps.length === 0 && (
            <div className="flex items-center gap-3 py-4">
              <svg className="w-5 h-5 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm text-[#F2EFEA]/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Starting browser agent...
              </span>
            </div>
          )}

          {steps.map((step, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 transition-all ${
                step.type === "complete"
                  ? "bg-[#6B8E6B]/5 border-[#6B8E6B]/20"
                  : step.type === "error"
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-[#2C2824]/50 border-[#3D3530]/50"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">
                  {stepIcons[step.type] || "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-medium ${
                        stepColors[step.type] || "text-[#F2EFEA]/40"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {step.type}
                    </span>
                    <span className="text-[10px] text-[#F2EFEA]/20">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                    {step.url && (
                      <span className="text-[10px] text-[#64B5F6]/60 truncate">
                        {step.url}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs text-[#F2EFEA]/70 mt-1 whitespace-pre-wrap"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {step.description}
                  </p>
                  {step.data !== undefined && step.data !== null && step.type !== "complete" && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-[#C48C56]/60 cursor-pointer hover:text-[#C48C56]/80">
                        View data
                      </summary>
                      <pre className="mt-1 text-[10px] text-[#F2EFEA]/30 bg-[#1A1714] rounded-lg p-2 overflow-x-auto max-h-40">
                        {formatData(step.data)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isRunning && steps.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2">
              <svg className="w-3.5 h-3.5 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-[#F2EFEA]/30">Agent is working...</span>
            </div>
          )}

          <div ref={stepsEndRef} />
        </div>

        {/* Footer */}
        {(isComplete || error) && !rateLimited && (
          <div className="px-5 py-3 border-t border-[#3D3530] flex items-center justify-between">
            <span className="text-[10px] text-[#F2EFEA]/20">
              {steps.length} steps executed
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSteps([]);
                  setIsComplete(false);
                  setError(null);
                  setTask("");
                }}
                className="px-3 py-1.5 text-xs text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 rounded-lg transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                New Task
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs bg-[#2C2824] text-[#F2EFEA]/60 rounded-lg hover:bg-[#3D3530] transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
