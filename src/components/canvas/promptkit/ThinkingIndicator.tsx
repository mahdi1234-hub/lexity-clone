"use client";

import { useState } from "react";

interface ThinkingIndicatorProps {
  text?: string;
  variant?: "dots" | "pulse" | "spinner" | "wave";
}

export function ThinkingIndicator({ text = "Thinking", variant = "dots" }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F2EFEA]/60">
      {variant === "dots" && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#C48C56]/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
      {variant === "pulse" && (
        <div className="w-2 h-2 rounded-full bg-[#C48C56]/60 animate-pulse" />
      )}
      {variant === "spinner" && (
        <svg className="w-3.5 h-3.5 text-[#C48C56] animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {variant === "wave" && (
        <div className="flex items-end gap-0.5 h-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-0.5 bg-[#C48C56]/40 rounded-full animate-pulse"
              style={{
                height: `${6 + (i % 3) * 4}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      )}
      <span className="text-[10px] text-[#2C2824]/35" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {text}
      </span>
    </div>
  );
}

// Reasoning display with collapsible chain of thought
interface ReasoningStep {
  id: string;
  title: string;
  content: string;
  status: "pending" | "running" | "done" | "error";
  duration?: string;
}

interface ReasoningDisplayProps {
  steps: ReasoningStep[];
  collapsed?: boolean;
}

export function ReasoningDisplay({ steps, collapsed: initialCollapsed = false }: ReasoningDisplayProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="rounded-xl bg-[#F2EFEA]/40 border border-black/5 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/3 transition-colors"
      >
        <svg
          className={`w-3 h-3 text-[#2C2824]/30 transition-transform ${collapsed ? "" : "rotate-90"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] font-medium text-[#C48C56]/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Reasoning
        </span>
        <span className="text-[9px] text-[#2C2824]/25 ml-auto">
          {doneCount}/{steps.length} steps
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-2 space-y-1.5">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">
                {step.status === "running" && (
                  <svg className="w-3 h-3 text-[#C48C56] animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {step.status === "done" && (
                  <svg className="w-3 h-3 text-[#81C784]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {step.status === "pending" && <div className="w-3 h-3 rounded-full border border-[#2C2824]/15" />}
                {step.status === "error" && (
                  <svg className="w-3 h-3 text-[#E57373]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-medium text-[#2C2824]/60">{step.title}</p>
                  {step.duration && (
                    <span className="text-[8px] text-[#2C2824]/20">{step.duration}</span>
                  )}
                </div>
                {step.content && step.status !== "pending" && (
                  <p className="text-[10px] text-[#2C2824]/35 mt-0.5 leading-relaxed">{step.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tool use indicator
interface ToolUseProps {
  toolName: string;
  status: "running" | "done" | "error";
  input?: string;
  output?: string;
}

export function ToolUseIndicator({ toolName, status, input, output }: ToolUseProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-[#E3F2FD]/30 border border-[#64B5F6]/15 px-2.5 py-1.5">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2">
        {status === "running" ? (
          <svg className="w-3 h-3 text-[#64B5F6] animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : status === "done" ? (
          <svg className="w-3 h-3 text-[#81C784] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-[#E57373] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        )}
        <span className="text-[10px] font-medium text-[#2C2824]/50">{status === "running" ? "Using" : "Used"}: {toolName}</span>
        <svg className={`w-2.5 h-2.5 text-[#2C2824]/20 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1">
          {input && (
            <div className="bg-white/50 rounded-md px-2 py-1">
              <p className="text-[9px] text-[#2C2824]/30 mb-0.5">Input</p>
              <p className="text-[10px] text-[#2C2824]/50 font-mono">{input}</p>
            </div>
          )}
          {output && (
            <div className="bg-white/50 rounded-md px-2 py-1">
              <p className="text-[9px] text-[#2C2824]/30 mb-0.5">Output</p>
              <p className="text-[10px] text-[#2C2824]/50 font-mono">{output}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sources/Citations
interface Source {
  title: string;
  url?: string;
  snippet?: string;
}

interface SourcesDisplayProps {
  sources: Source[];
}

export function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (sources.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-medium text-[#2C2824]/30 uppercase tracking-wider">Sources</p>
      {sources.map((src, i) => (
        <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-lg bg-[#F2EFEA]/40">
          <span className="text-[9px] text-[#C48C56]/50 font-medium mt-0.5">[{i + 1}]</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#2C2824]/60 font-medium truncate">{src.title}</p>
            {src.snippet && <p className="text-[9px] text-[#2C2824]/30 line-clamp-1">{src.snippet}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Follow-up suggestions
interface SuggestionsProps {
  items: string[];
  onSelect: (suggestion: string) => void;
}

export function Suggestions({ items, onSelect }: SuggestionsProps) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-medium text-[#2C2824]/30 uppercase tracking-wider">Follow up</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item)}
            className="px-2.5 py-1 rounded-lg bg-white border border-black/5 text-[10px] text-[#2C2824]/60 hover:border-[#C48C56]/30 hover:text-[#C48C56] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// Progress bar
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      {label && <p className="text-[10px] text-[#2C2824]/40">{label}</p>}
      <div className="h-1.5 rounded-full bg-[#F2EFEA] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C48C56] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Copy button
interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-black/5 transition-colors text-[#2C2824]/30 hover:text-[#2C2824]/50"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 text-[#81C784]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[9px] text-[#81C784]">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="text-[9px]">Copy</span>
        </>
      )}
    </button>
  );
}

// Feedback buttons
interface FeedbackButtonsProps {
  onFeedback: (type: "up" | "down") => void;
}

export function FeedbackButtons({ onFeedback }: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<"up" | "down" | null>(null);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { setSelected("up"); onFeedback("up"); }}
        className={`p-1 rounded-md transition-colors ${selected === "up" ? "bg-[#81C784]/10 text-[#81C784]" : "text-[#2C2824]/20 hover:text-[#2C2824]/40 hover:bg-black/5"}`}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>
      <button
        onClick={() => { setSelected("down"); onFeedback("down"); }}
        className={`p-1 rounded-md transition-colors ${selected === "down" ? "bg-[#E57373]/10 text-[#E57373]" : "text-[#2C2824]/20 hover:text-[#2C2824]/40 hover:bg-black/5"}`}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </button>
    </div>
  );
}

// Code block display
interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  return (
    <div className="rounded-lg bg-[#1E1E1E] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2D2D2D]">
        <span className="text-[9px] text-white/30 font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="px-3 py-2 overflow-x-auto">
        <code className="text-[10px] text-white/80 font-mono leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

// Error state
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl bg-[#FFEBEE]/50 border border-[#E57373]/15 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-[#E57373] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="flex-1">
          <p className="text-[10px] text-[#E57373] font-medium">Something went wrong</p>
          <p className="text-[10px] text-[#2C2824]/40 mt-0.5">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-2.5 py-1 rounded-lg bg-[#E57373]/10 text-[10px] font-medium text-[#E57373] hover:bg-[#E57373]/20 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Model/token info badge
interface ModelBadgeProps {
  model: string;
  tokens?: number;
}

export function ModelBadge({ model, tokens }: ModelBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F2EFEA]/60">
        <div className="w-1.5 h-1.5 rounded-full bg-[#81C784]" />
        <span className="text-[9px] text-[#2C2824]/40 font-medium">{model}</span>
      </div>
      {tokens !== undefined && (
        <span className="text-[9px] text-[#2C2824]/20">{tokens} tokens</span>
      )}
    </div>
  );
}
