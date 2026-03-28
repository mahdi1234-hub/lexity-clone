"use client";

import { useCallback, useState } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useOthers, useMyPresence, useSelf, useThreads } from "../../liveblocks.config";
import CollaborationCursors from "./CollaborationCursors";
import CollaborationComments from "./CollaborationComments";
import OverlayComments from "./OverlayComments";
import MeetingReport from "./MeetingReport";

interface CollaborativeWhiteboardProps {
  roomId: string;
}

export default function CollaborativeWhiteboard({ roomId }: CollaborativeWhiteboardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editor, setEditor] = useState<Editor | null>(null);
  const others = useOthers();
  const self = useSelf();
  const { threads } = useThreads();
  const [, updateMyPresence] = useMyPresence();
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Track pointer for cursor sharing
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      });
    },
    [updateMyPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const generateReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const participantNames = [
        self?.info?.name || "You",
        ...others.map((o) => o.info?.name || "Collaborator"),
      ];

      const res = await fetch("/api/meeting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threads: threads?.map((t) => ({
            comments: t.comments?.map((c) => ({
              body: c.body,
              userId: (c as unknown as { userId?: string }).userId,
            })),
            metadata: t.metadata,
          })),
          roomId,
          participants: participantNames,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReportData(data.report);
    } catch (error) {
      console.error("Report generation error:", error);
    } finally {
      setReportLoading(false);
    }
  }, [threads, roomId, self, others]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          backgroundColor: "#2C2824",
          borderBottom: "1px solid #3D3530",
          flexShrink: 0,
          zIndex: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(242,239,234,0.8)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              margin: 0,
            }}
          >
            Collaborative Whiteboard
          </h2>
          <span
            style={{
              fontSize: 11,
              color: "rgba(196,140,86,0.6)",
              padding: "2px 8px",
              borderRadius: 999,
              backgroundColor: "rgba(196,140,86,0.1)",
            }}
          >
            {roomId}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Active collaborators */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {self && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid #2C2824",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: self.info?.color || "#C48C56",
                  marginRight: -8,
                  position: "relative",
                  zIndex: 2,
                }}
                title={`${self.info?.name || "You"} (you)`}
              >
                {(self.info?.name || "Y")[0].toUpperCase()}
              </div>
            )}
            {others.map((other, i) => (
              <div
                key={other.connectionId}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid #2C2824",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: other.info?.color || "#7986CB",
                  marginRight: i < others.length - 1 ? -8 : 0,
                  position: "relative",
                  zIndex: 1,
                }}
                title={other.info?.name || "Collaborator"}
              >
                {(other.info?.name || "?")[0].toUpperCase()}
              </div>
            ))}
          </div>

          <span style={{ fontSize: 11, color: "rgba(242,239,234,0.4)" }}>
            {others.length + 1} online
          </span>

          <div style={{ height: 16, width: 1, backgroundColor: "#3D3530" }} />

          {/* Toggle buttons */}
          <button
            onClick={() => setCommentsOpen((prev) => !prev)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: commentsOpen ? "rgba(196,140,86,0.2)" : "transparent",
              color: commentsOpen ? "#C48C56" : "rgba(242,239,234,0.4)",
            }}
          >
            {commentsOpen ? "Hide Comments" : "Show Comments"}
          </button>
          <button
            onClick={() => setShowOverlay((prev) => !prev)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: showOverlay ? "rgba(196,140,86,0.2)" : "transparent",
              color: showOverlay ? "#C48C56" : "rgba(242,239,234,0.4)",
            }}
          >
            Overlay
          </button>

          <div style={{ height: 16, width: 1, backgroundColor: "#3D3530" }} />

          {/* Generate Report button */}
          <button
            onClick={generateReport}
            disabled={reportLoading}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              borderRadius: 8,
              border: "none",
              cursor: reportLoading ? "wait" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: "#C48C56",
              color: "white",
              opacity: reportLoading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {reportLoading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Main content area: whiteboard + comments panel */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Whiteboard container - takes all remaining space */}
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* TLDraw fills this entire container */}
          <div style={{ position: "absolute", inset: 0 }}>
            <Tldraw
              onMount={(editorInstance: Editor) => {
                setEditor(editorInstance);
              }}
            />
          </div>

          {/* Cursor overlay - pointer-events: none so it doesn't block tldraw */}
          <CollaborationCursors />

          {/* Overlay comment pins */}
          {showOverlay && <OverlayComments />}
        </div>

        {/* Collapsible comments panel */}
        <div
          style={{
            width: commentsOpen ? 320 : 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "rgba(44,40,36,0.95)",
            borderLeft: commentsOpen ? "1px solid #3D3530" : "none",
            position: "relative",
            zIndex: 50,
          }}
        >
          <div style={{ width: 320, height: "100%" }}>
            <CollaborationComments />
          </div>
        </div>
      </div>

      {/* Meeting Report Overlay */}
      {reportData && (
        <MeetingReport
          report={reportData}
          roomId={roomId}
          participants={[
            self?.info?.name || "You",
            ...others.map((o) => o.info?.name || "Collaborator"),
          ]}
          onClose={() => setReportData(null)}
        />
      )}
    </div>
  );
}
