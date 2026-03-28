"use client";

import { useState } from "react";

interface DataOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface DataSelectorModalProps {
  type: string;
  title: string;
  onConfirm: (selectedOptions: string[]) => void;
  onCancel: () => void;
}

const optionsByType: Record<string, DataOption[]> = {
  gmail: [
    { id: "inbox", label: "Inbox", description: "Latest emails in your inbox", checked: true },
    { id: "unread", label: "Unread Only", description: "Show only unread messages", checked: false },
    { id: "starred", label: "Starred", description: "Starred/important emails", checked: false },
    { id: "sent", label: "Sent", description: "Recently sent emails", checked: false },
  ],
  calendar: [
    { id: "today", label: "Today", description: "Events happening today", checked: true },
    { id: "week", label: "This Week", description: "All events this week", checked: true },
    { id: "upcoming", label: "Upcoming", description: "Next 30 days of events", checked: false },
  ],
  tasks: [
    { id: "pending", label: "Pending Tasks", description: "Tasks not yet completed", checked: true },
    { id: "completed", label: "Completed", description: "Recently completed tasks", checked: false },
    { id: "overdue", label: "Overdue", description: "Tasks past their due date", checked: true },
    { id: "all", label: "All Tasks", description: "Show everything", checked: false },
  ],
  meet: [
    { id: "upcoming", label: "Upcoming Meetings", description: "Meetings in the next 24 hours", checked: true },
    { id: "today", label: "Today Only", description: "Only meetings happening today", checked: false },
    { id: "week", label: "This Week", description: "All meetings this week", checked: false },
  ],
  chart: [
    { id: "bar", label: "Bar Chart", description: "Vertical bar chart", checked: true },
    { id: "line", label: "Line Chart", description: "Line/area chart", checked: false },
    { id: "pie", label: "Pie Chart", description: "Pie/donut chart", checked: false },
    { id: "radar", label: "Radar Chart", description: "Spider/radar chart", checked: false },
  ],
};

const typeIcons: Record<string, { color: string; label: string }> = {
  gmail: { color: "#EA4335", label: "Gmail" },
  calendar: { color: "#4285F4", label: "Google Calendar" },
  tasks: { color: "#4285F4", label: "Google Tasks" },
  meet: { color: "#00832D", label: "Google Meet" },
  chart: { color: "#C48C56", label: "Chart" },
};

export default function DataSelectorModal({ type, title, onConfirm, onCancel }: DataSelectorModalProps) {
  const [options, setOptions] = useState<DataOption[]>(
    optionsByType[type] || [{ id: "default", label: "Default", description: "Load default data", checked: true }]
  );

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, checked: !opt.checked } : opt))
    );
  };

  const handleConfirm = () => {
    const selected = options.filter((o) => o.checked).map((o) => o.id);
    onConfirm(selected);
  };

  const typeInfo = typeIcons[type] || { color: "#C48C56", label: type };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-[#2C2824] rounded-2xl border border-[#3D3530] shadow-2xl w-[400px] max-h-[500px] overflow-hidden"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${typeInfo.color}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeInfo.color }} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#F2EFEA]">{title}</h3>
              <p className="text-[10px] text-[#F2EFEA]/30">{typeInfo.label}</p>
            </div>
          </div>
          <p className="text-xs text-[#F2EFEA]/50 mt-2">
            Select what data you want to display on the canvas:
          </p>
        </div>

        {/* Options */}
        <div className="px-5 py-2 max-h-[280px] overflow-y-auto space-y-1.5">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                option.checked
                  ? "border-[#C48C56]/40 bg-[#C48C56]/5"
                  : "border-[#3D3530] hover:border-[#3D3530]/80 bg-transparent"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  option.checked ? "bg-[#C48C56] border-[#C48C56]" : "border-[#3D3530]"
                }`}
              >
                {option.checked && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-[#F2EFEA]/80">{option.label}</p>
                <p className="text-[10px] text-[#F2EFEA]/30 mt-0.5">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#3D3530] flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs text-[#F2EFEA]/50 hover:text-[#F2EFEA]/70 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={options.every((o) => !o.checked)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#C48C56] rounded-xl hover:bg-[#C48C56]/80 transition-colors disabled:opacity-30"
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
