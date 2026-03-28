"use client";

import { memo } from "react";

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  unread: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: number;
}

interface TaskItem {
  id: string;
  title: string;
  due?: string;
  completed: boolean;
  notes?: string;
}

interface MeetingItem {
  id: string;
  title: string;
  time: string;
  link: string;
  participants: number;
}

type WidgetType = "gmail" | "calendar" | "tasks" | "meet";

interface GoogleWorkspaceWidgetProps {
  type: WidgetType;
  title: string;
  connected: boolean;
  onConnect?: () => void;
  emails?: EmailItem[];
  events?: CalendarEvent[];
  tasks?: TaskItem[];
  meetings?: MeetingItem[];
}

const icons: Record<WidgetType, { color: string; path: string }> = {
  gmail: {
    color: "#EA4335",
    path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  },
  calendar: {
    color: "#4285F4",
    path: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z",
  },
  tasks: {
    color: "#4285F4",
    path: "M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-1.01 3.73-2.64 5.14l1.42 1.42C20.16 17.14 22 14.76 22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c1.38 0 2.7-.28 3.9-.78l-1.44-1.44c-.78.28-1.61.42-2.46.42z",
  },
  meet: {
    color: "#00832D",
    path: "M12 3c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 14c-3.31 0-6-2.69-6-6h2c0 2.21 1.79 4 4 4s4-1.79 4-4h2c0 3.31-2.69 6-6 6z",
  },
};

function GoogleWorkspaceWidget({ type, title, connected, onConnect, emails, events, tasks, meetings }: GoogleWorkspaceWidgetProps) {
  const icon = icons[type];

  if (!connected) {
    return (
      <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 340, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${icon.color}20` }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={icon.color}><path d={icon.path} /></svg>
          </div>
          <p className="text-sm font-medium text-[#F2EFEA]/80 mb-1">{title}</p>
          <p className="text-[10px] text-[#F2EFEA]/30 mb-4">Connect your Google account to see your data</p>
          <button
            onClick={onConnect}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: icon.color }}
          >
            Connect {type === "gmail" ? "Gmail" : type === "calendar" ? "Calendar" : type === "tasks" ? "Tasks" : "Meet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 360, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-4 pt-3 pb-2 border-b border-[#3D3530]/50 flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={icon.color}><path d={icon.path} /></svg>
        <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6B8E6B]" title="Connected" />
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {/* Gmail */}
        {type === "gmail" && emails?.map((email) => (
          <div key={email.id} className={`px-4 py-2.5 border-b border-[#3D3530]/30 ${email.unread ? "bg-white/[0.02]" : ""}`}>
            <div className="flex items-center gap-2">
              {email.unread && <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56] flex-shrink-0" />}
              <p className={`text-xs ${email.unread ? "font-medium text-[#F2EFEA]/90" : "text-[#F2EFEA]/60"} truncate`}>{email.subject}</p>
            </div>
            <p className="text-[10px] text-[#F2EFEA]/30 truncate mt-0.5">{email.from}</p>
            <p className="text-[10px] text-[#F2EFEA]/20 truncate">{email.snippet}</p>
          </div>
        ))}

        {/* Calendar */}
        {type === "calendar" && events?.map((event) => (
          <div key={event.id} className="px-4 py-2.5 border-b border-[#3D3530]/30">
            <div className="flex items-start gap-3">
              <div className="text-center flex-shrink-0 pt-0.5">
                <div className="text-[10px] text-[#C48C56] font-medium">{new Date(event.start).toLocaleDateString([], { weekday: "short" })}</div>
                <div className="text-lg font-light text-[#F2EFEA]/80">{new Date(event.start).getDate()}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#F2EFEA]/80">{event.title}</p>
                <p className="text-[10px] text-[#F2EFEA]/30">{new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                {event.location && <p className="text-[10px] text-[#C48C56]/50 truncate">{event.location}</p>}
              </div>
            </div>
          </div>
        ))}

        {/* Tasks */}
        {type === "tasks" && tasks?.map((task) => (
          <div key={task.id} className="px-4 py-2.5 border-b border-[#3D3530]/30 flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${task.completed ? "bg-[#6B8E6B] border-[#6B8E6B]" : "border-[#3D3530]"}`}>
              {task.completed && (
                <svg className="w-2.5 h-2.5 text-white mx-auto mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${task.completed ? "line-through text-[#F2EFEA]/30" : "text-[#F2EFEA]/80"}`}>{task.title}</p>
              {task.due && <p className="text-[10px] text-[#F2EFEA]/20 mt-0.5">Due: {task.due}</p>}
            </div>
          </div>
        ))}

        {/* Meet */}
        {type === "meet" && meetings?.map((meeting) => (
          <div key={meeting.id} className="px-4 py-2.5 border-b border-[#3D3530]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#F2EFEA]/80">{meeting.title}</p>
                <p className="text-[10px] text-[#F2EFEA]/30">{meeting.time}</p>
              </div>
              <a
                href={meeting.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg text-[10px] font-medium text-white bg-[#00832D] hover:bg-[#00832D]/80 transition-colors"
              >
                Join
              </a>
            </div>
            <p className="text-[9px] text-[#F2EFEA]/20 mt-0.5">{meeting.participants} participants</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(GoogleWorkspaceWidget);
