"use client";

import { useState, useRef, useEffect } from "react";

interface ThinkingStep {
  id: string;
  type: "thinking" | "tool_use" | "result" | "error";
  title: string;
  content: string;
  status: "pending" | "running" | "done" | "error";
  timestamp: string;
}

interface SidebarMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
}

interface AISidebarProps {
  onSendMessage: (message: string) => void;
  messages: SidebarMessage[];
  isProcessing: boolean;
  onAddNode: (type: string, data: Record<string, unknown>) => void;
}

export default function AISidebar({ onSendMessage, messages, isProcessing, onAddNode }: AISidebarProps) {
  const [input, setInput] = useState("");
  const [agentMode, setAgentMode] = useState<"chat" | "canvas" | "research">("canvas");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const modes = [
    { id: "chat", label: "Chat", icon: "💬", desc: "Standard conversation" },
    { id: "canvas", label: "Canvas", icon: "🎨", desc: "Add content to canvas" },
    { id: "research", label: "Research", icon: "🔍", desc: "Deep research mode" },
  ];

  const quickActions = [
    { label: "Add Note", icon: "📝", action: () => onAddNode("text", { content: "New note...", editable: true }) },
    { label: "Add Chart", icon: "📊", action: () => onAddNode("chart", { title: "Sample Chart", chartType: "bar", chartData: { items: [{ label: "A", value: 40 }, { label: "B", value: 65 }, { label: "C", value: 30 }], keys: ["value"], indexBy: "label" } }) },
    { label: "Email Widget", icon: "📧", action: () => onAddNode("widget", { widgetType: "email", title: "Inbox", items: [{ id: "1", title: "New project update", subtitle: "team@company.com", time: "2m ago", status: "unread" }, { id: "2", title: "Meeting notes", subtitle: "john@company.com", time: "1h ago", status: "read" }] }) },
    { label: "Calendar", icon: "📅", action: () => onAddNode("widget", { widgetType: "calendar", title: "Today", items: [{ id: "1", title: "Team standup", subtitle: "9:00 AM - 9:30 AM", time: "9:00", status: "upcoming" }, { id: "2", title: "Design review", subtitle: "2:00 PM - 3:00 PM", time: "14:00", status: "upcoming" }] }) },
    { label: "Tasks", icon: "✅", action: () => onAddNode("widget", { widgetType: "tasks", title: "My Tasks", items: [{ id: "1", title: "Review PR #42", status: "pending" }, { id: "2", title: "Update documentation", status: "done" }, { id: "3", title: "Deploy staging", status: "pending" }] }) },
    { label: "Meet", icon: "🎥", action: () => onAddNode("widget", { widgetType: "meet", title: "Meetings", items: [{ id: "1", title: "Weekly sync", subtitle: "In 30 minutes", time: "10:00", status: "upcoming" }] }) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] border-l border-black/5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#81C784] animate-pulse" />
          <span className="text-xs font-medium text-[#2C2824]/70">
            {isProcessing ? "Running" : "Ready"}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-[#2C2824]/40">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-[#2C2824]/40">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-b border-black/5">
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[#2C2824]/50 hover:text-[#2C2824]/80 hover:bg-black/5 transition-colors"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[#C48C56]/5 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#C48C56]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#2C2824]/30 mb-1">Start a conversation</p>
            <p className="text-[10px] text-[#2C2824]/20">Ask me to add content to your canvas</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] bg-[#2C2824] text-white/90 rounded-2xl rounded-br-md px-3 py-2">
                <p className="text-xs leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Chain of thought / thinking steps */}
                {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                  <div className="bg-[#F2EFEA]/50 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium text-[#C48C56]/60">Task steps</span>
                    </div>
                    {msg.thinkingSteps.map((step) => (
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
                          {step.status === "pending" && (
                            <div className="w-3 h-3 rounded-full border border-[#2C2824]/20" />
                          )}
                          {step.status === "error" && (
                            <svg className="w-3 h-3 text-[#E57373]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-[#2C2824]/60">{step.title}</p>
                          {step.content && step.status !== "pending" && (
                            <p className="text-[10px] text-[#2C2824]/35 mt-0.5">{step.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant message */}
                <div className="bg-white rounded-2xl rounded-bl-md border border-black/5 px-3 py-2 shadow-sm">
                  <p className="text-xs text-[#2C2824]/70 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3 bg-[#C48C56]/60 ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-black/5">
                    <span className="text-[9px] text-[#2C2824]/25">{msg.timestamp}</span>
                    {!msg.isStreaming && (
                      <span className="text-[9px] text-[#2C2824]/20">AI Assistant</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[10px] text-[#2C2824]/30">Agent thinking...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-3 py-3 border-t border-black/5">
        <div className="bg-white rounded-2xl border border-black/8 shadow-sm">
          <div className="flex items-end gap-2 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Start a new topic..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-xs p-1.5 max-h-[100px] placeholder:text-[#2C2824]/25 text-[#2C2824]/80"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-2 rounded-xl bg-[#2C2824] text-white/90 transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Agent Mode Selector */}
          <div className="px-2 pb-2 relative">
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors text-[10px] text-[#2C2824]/40"
            >
              <span>{modes.find(m => m.id === agentMode)?.icon}</span>
              <span>{modes.find(m => m.id === agentMode)?.label} mode</span>
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showModeMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl border border-black/8 shadow-lg p-1 z-50 min-w-[180px]">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setAgentMode(mode.id as typeof agentMode);
                      setShowModeMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      agentMode === mode.id ? "bg-[#C48C56]/5" : "hover:bg-black/3"
                    }`}
                  >
                    <span className="text-sm">{mode.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-[#2C2824]/70">{mode.label}</p>
                      <p className="text-[10px] text-[#2C2824]/30">{mode.desc}</p>
                    </div>
                    {agentMode === mode.id && (
                      <svg className="w-3 h-3 text-[#C48C56] ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
