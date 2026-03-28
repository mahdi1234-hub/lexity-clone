"use client";

import { useRef, useCallback } from "react";

interface ActionItem {
  id: number;
  action: string;
  priority: string;
  assignee: string;
  deadline: string;
}

interface KeyDiscussion {
  topic: string;
  summary: string;
  status: string;
}

interface ReportData {
  title: string;
  date: string;
  summary: string;
  keyDiscussions: KeyDiscussion[];
  actionItems: ActionItem[];
  decisions: string[];
  nextSteps: string[];
  risks: string[];
}

interface MeetingReportProps {
  report: ReportData;
  roomId: string;
  participants: string[];
  onClose: () => void;
}

export default function MeetingReport({
  report,
  roomId,
  participants,
  onClose,
}: MeetingReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(() => {
    if (!reportRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = reportRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title || "Meeting Report"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          @page {
            size: A4;
            margin: 20mm 15mm;
            @bottom-center {
              content: counter(page) " of " counter(pages);
              font-family: 'Source Sans 3', sans-serif;
              font-size: 9pt;
              color: #8B7355;
            }
          }

          body {
            font-family: 'Source Sans 3', sans-serif;
            color: #2C2824;
            line-height: 1.6;
            background: white;
          }

          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
          }

          /* Newspaper masthead */
          .masthead {
            text-align: center;
            border-bottom: 4px double #2C2824;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }

          .masthead-title {
            font-family: 'Playfair Display', serif;
            font-size: 36pt;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #2C2824;
            line-height: 1.1;
          }

          .masthead-subtitle {
            font-family: 'Source Sans 3', sans-serif;
            font-size: 10pt;
            color: #8B7355;
            margin-top: 6px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .masthead-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            color: #666;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
          }

          /* Table of Contents */
          .toc {
            background: #FAF8F5;
            border: 1px solid #E8E4DE;
            border-radius: 4px;
            padding: 16px 20px;
            margin-bottom: 24px;
            page-break-inside: avoid;
          }

          .toc-title {
            font-family: 'Playfair Display', serif;
            font-size: 14pt;
            font-weight: 700;
            color: #2C2824;
            margin-bottom: 10px;
            border-bottom: 1px solid #E8E4DE;
            padding-bottom: 6px;
          }

          .toc-list {
            list-style: none;
            columns: 2;
            column-gap: 24px;
          }

          .toc-item {
            font-size: 10pt;
            padding: 3px 0;
            color: #5C5248;
            border-bottom: 1px dotted #ddd;
          }

          .toc-item span {
            font-weight: 600;
            color: #C48C56;
            margin-right: 6px;
          }

          /* Section styling */
          .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }

          .section-header {
            font-family: 'Playfair Display', serif;
            font-size: 16pt;
            font-weight: 700;
            color: #2C2824;
            border-bottom: 2px solid #C48C56;
            padding-bottom: 4px;
            margin-bottom: 12px;
          }

          .section-number {
            color: #C48C56;
            font-weight: 400;
            margin-right: 8px;
          }

          /* Executive summary - newspaper columns */
          .summary-text {
            font-size: 11pt;
            line-height: 1.7;
            color: #3D3530;
            columns: 2;
            column-gap: 24px;
            column-rule: 1px solid #E8E4DE;
            text-align: justify;
          }

          .summary-text p {
            margin-bottom: 10px;
            text-indent: 1.5em;
          }

          .summary-text p:first-child {
            text-indent: 0;
          }

          .summary-text p:first-child::first-letter {
            font-family: 'Playfair Display', serif;
            font-size: 3.2em;
            float: left;
            line-height: 0.8;
            margin-right: 6px;
            margin-top: 4px;
            color: #C48C56;
            font-weight: 900;
          }

          /* Discussion cards */
          .discussion-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .discussion-card {
            border: 1px solid #E8E4DE;
            border-radius: 4px;
            padding: 12px;
            background: #FDFCFB;
          }

          .discussion-card .topic {
            font-family: 'Playfair Display', serif;
            font-size: 11pt;
            font-weight: 700;
            color: #2C2824;
            margin-bottom: 4px;
          }

          .discussion-card .desc {
            font-size: 9.5pt;
            color: #5C5248;
            line-height: 1.5;
          }

          .status-badge {
            display: inline-block;
            font-size: 8pt;
            padding: 1px 8px;
            border-radius: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 6px;
          }

          .status-resolved { background: #E8F5E9; color: #2E7D32; }
          .status-open { background: #FFF3E0; color: #E65100; }
          .status-in-progress { background: #E3F2FD; color: #1565C0; }

          /* Action items table */
          .action-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
          }

          .action-table thead {
            background: #2C2824;
            color: #F2EFEA;
          }

          .action-table th {
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .action-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #E8E4DE;
            vertical-align: top;
          }

          .action-table tr:nth-child(even) {
            background: #FAF8F5;
          }

          .priority-high { color: #C62828; font-weight: 700; }
          .priority-medium { color: #E65100; font-weight: 600; }
          .priority-low { color: #2E7D32; font-weight: 500; }

          /* Lists */
          .styled-list {
            list-style: none;
            padding: 0;
          }

          .styled-list li {
            padding: 6px 0 6px 20px;
            position: relative;
            font-size: 10.5pt;
            color: #3D3530;
            border-bottom: 1px dotted #E8E4DE;
          }

          .styled-list li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 12px;
            width: 8px;
            height: 8px;
            background: #C48C56;
            border-radius: 50%;
          }

          .risk-list li::before {
            background: #C62828;
          }

          /* Footer */
          .report-footer {
            margin-top: 32px;
            padding-top: 12px;
            border-top: 4px double #2C2824;
            text-align: center;
            font-size: 8.5pt;
            color: #8B7355;
          }

          .page-number {
            position: fixed;
            bottom: 10mm;
            right: 15mm;
            font-size: 9pt;
            color: #8B7355;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [report.title]);

  const priorityClass = (p: string) => {
    const lower = p?.toLowerCase() || "";
    if (lower === "high") return "priority-high";
    if (lower === "medium") return "priority-medium";
    return "priority-low";
  };

  const statusClass = (s: string) => {
    const lower = s?.toLowerCase() || "";
    if (lower === "resolved") return "status-badge status-resolved";
    if (lower === "in-progress") return "status-badge status-in-progress";
    return "status-badge status-open";
  };

  const sections = [
    "Executive Summary",
    "Key Discussions",
    "Action Items",
    "Decisions Made",
    "Next Steps",
    ...(report.risks?.length ? ["Risks & Concerns"] : []),
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(26,23,20,0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          backgroundColor: "#2C2824",
          borderBottom: "1px solid #3D3530",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(242,239,234,0.8)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Meeting Report
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportPDF}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#C48C56",
              color: "white",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Export as PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #3D3530",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "rgba(242,239,234,0.6)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Report preview */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          ref={reportRef}
          style={{
            maxWidth: 800,
            width: "100%",
            backgroundColor: "white",
            padding: "40px",
            borderRadius: 8,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="report-container">
            {/* Masthead */}
            <div className="masthead">
              <div className="masthead-title">
                {report.title || "Collaboration Report"}
              </div>
              <div className="masthead-subtitle">
                Meeting Minutes &amp; Action Plan
              </div>
              <div className="masthead-meta">
                <span>Room: {roomId}</span>
                <span>{report.date || new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                <span>
                  {participants.length > 0
                    ? `${participants.length} Participant${participants.length > 1 ? "s" : ""}`
                    : "Team Session"}
                </span>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="toc">
              <div className="toc-title">Table of Contents</div>
              <ul className="toc-list">
                {sections.map((s, i) => (
                  <li key={i} className="toc-item">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* 1. Executive Summary */}
            <div className="section">
              <div className="section-header">
                <span className="section-number">01</span>
                Executive Summary
              </div>
              <div className="summary-text">
                {(report.summary || "No summary available.")
                  .split("\n")
                  .filter(Boolean)
                  .map((p: string, i: number) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            </div>

            {/* 2. Key Discussions */}
            {report.keyDiscussions?.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-number">02</span>
                  Key Discussions
                </div>
                <div className="discussion-grid">
                  {report.keyDiscussions.map((d, i) => (
                    <div key={i} className="discussion-card">
                      <div className="topic">{d.topic}</div>
                      <div className="desc">{d.summary}</div>
                      <div className={statusClass(d.status)}>
                        {d.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Action Items */}
            {report.actionItems?.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-number">03</span>
                  Action Items
                </div>
                <table className="action-table">
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "45%" }}>Action</th>
                      <th style={{ width: "12%" }}>Priority</th>
                      <th style={{ width: "18%" }}>Assignee</th>
                      <th style={{ width: "20%" }}>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.actionItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.action}</td>
                        <td>
                          <span className={priorityClass(item.priority)}>
                            {item.priority?.toUpperCase()}
                          </span>
                        </td>
                        <td>{item.assignee}</td>
                        <td>{item.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Decisions */}
            {report.decisions?.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-number">04</span>
                  Decisions Made
                </div>
                <ul className="styled-list">
                  {report.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. Next Steps */}
            {report.nextSteps?.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-number">05</span>
                  Next Steps
                </div>
                <ul className="styled-list">
                  {report.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Risks */}
            {report.risks?.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-number">06</span>
                  Risks &amp; Concerns
                </div>
                <ul className="styled-list risk-list">
                  {report.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="report-footer">
              <p>
                This report was auto-generated from the collaborative whiteboard
                session.
              </p>
              <p style={{ marginTop: 4 }}>
                Room: {roomId} | Generated:{" "}
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
