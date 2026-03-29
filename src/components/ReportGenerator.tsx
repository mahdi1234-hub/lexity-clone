"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const FN = "Plus Jakarta Sans, sans-serif";
// Theme accent used in PDF generation
const _THEME_ACCENT = "#C48C56"; // eslint-disable-line @typescript-eslint/no-unused-vars

interface ReportGeneratorProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  summary: string;
  insights: string[];
  kpiValues: { label: string; value: string }[];
  columnStats: { name: string; type: string; count: number; missing: number; unique: number; min?: number; max?: number; mean?: number; stddev?: number }[];
  totalRows: number;
  totalColumns: number;
  chartCount: number;
  dataSource: string;
  onReportSaved?: (reportId: string) => void;
}

function generateAutoTags(title: string, summary: string, insights: string[], columnStats: { name: string; type: string }[]): string[] {
  const tags = new Set<string>();
  tags.add("Report");

  const text = `${title} ${summary} ${insights.join(" ")}`.toLowerCase();

  // Domain detection
  const domainKeywords: Record<string, string[]> = {
    "Finance": ["revenue", "profit", "cost", "price", "income", "expense", "budget", "financial", "salary", "payment"],
    "Healthcare": ["patient", "hospital", "medical", "health", "disease", "treatment", "clinical", "diagnosis"],
    "Energy": ["solar", "energy", "power", "electricity", "renewable", "emission", "carbon", "wind", "fuel"],
    "Sales": ["sales", "customer", "order", "product", "revenue", "purchase", "retail", "commerce"],
    "Education": ["student", "school", "university", "grade", "course", "education", "learning"],
    "Demographics": ["population", "age", "gender", "census", "demographic", "region", "country"],
    "Technology": ["software", "hardware", "tech", "digital", "data", "algorithm", "compute"],
    "Environment": ["climate", "weather", "temperature", "pollution", "environmental", "sustainability"],
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      tags.add(domain);
    }
  }

  // Data type tags
  const numericCols = columnStats.filter((c) => c.type === "numeric").length;
  const categoricalCols = columnStats.filter((c) => c.type === "categorical").length;
  if (numericCols > 3) tags.add("Quantitative Analysis");
  if (categoricalCols > 2) tags.add("Categorical Data");
  if (columnStats.some((c) => c.type === "date")) tags.add("Time Series");

  // Analysis type
  if (text.includes("correlation") || text.includes("relationship")) tags.add("Correlation");
  if (text.includes("trend") || text.includes("growth")) tags.add("Trend Analysis");
  if (text.includes("distribution")) tags.add("Distribution");
  if (text.includes("comparison") || text.includes("compare")) tags.add("Comparative");

  return Array.from(tags).slice(0, 8);
}

function generateAutoDescription(title: string, summary: string, totalRows: number, totalColumns: number, chartCount: number): string {
  return `${summary.slice(0, 200)}${summary.length > 200 ? "..." : ""} This report analyzes ${totalRows.toLocaleString()} rows across ${totalColumns} columns, featuring ${chartCount} visualizations.`;
}

export default function ReportGenerator({
  dashboardRef,
  title,
  summary,
  insights,
  kpiValues,
  columnStats,
  totalRows,
  totalColumns,
  chartCount,
  dataSource,
  onReportSaved,
}: ReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);

  const generatePDF = async () => {
    if (!dashboardRef.current || generating) return;
    setGenerating(true);
    setProgress(10);

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      // Create PDF
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // ========== COVER PAGE ==========
      // Header gradient bar
      pdf.setFillColor(44, 40, 36); // #2C2824
      pdf.rect(0, 0, pageWidth, 45, "F");

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      const titleLines = pdf.splitTextToSize(title || "Data Analysis Report", contentWidth);
      pdf.text(titleLines, margin, 25);

      // Subtitle with accent color
      pdf.setFontSize(12);
      pdf.setTextColor(196, 140, 86); // #C48C56
      pdf.text("Exploratory Data Analysis Report", margin, 38);

      setProgress(20);

      // Summary section
      let y = 55;
      pdf.setFontSize(10);
      pdf.setTextColor(44, 40, 36);
      const summaryLines = pdf.splitTextToSize(summary || "", contentWidth);
      pdf.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 8;

      // Metadata box
      pdf.setFillColor(245, 240, 235);
      pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 90, 80);
      pdf.text(`Data Source: ${dataSource}`, margin + 5, y + 7);
      pdf.text(`Rows: ${totalRows.toLocaleString()} | Columns: ${totalColumns} | Charts: ${chartCount}`, margin + 5, y + 14);
      pdf.text(`Generated: ${dateStr}`, margin + 5, y + 21);
      y += 36;

      // KPI Section
      if (kpiValues.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 40, 36);
        pdf.text("Key Metrics", margin, y);
        y += 8;

        const kpiWidth = (contentWidth - 8) / Math.min(kpiValues.length, 4);
        kpiValues.slice(0, 4).forEach((kpi, i) => {
          const kx = margin + i * (kpiWidth + 2);
          pdf.setFillColor(252, 249, 245);
          pdf.setDrawColor(196, 140, 86);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(kx, y, kpiWidth, 18, 2, 2, "FD");
          pdf.setFontSize(7);
          pdf.setTextColor(120, 110, 100);
          pdf.setFont("helvetica", "normal");
          pdf.text(kpi.label.toUpperCase(), kx + kpiWidth / 2, y + 6, { align: "center" });
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(196, 140, 86);
          pdf.text(kpi.value, kx + kpiWidth / 2, y + 14, { align: "center" });
        });
        y += 26;
      }

      setProgress(30);

      // Insights Section
      if (insights.length > 0) {
        if (y > pageHeight - 60) {
          addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
          pdf.addPage();
          y = margin + 5;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 40, 36);
        pdf.text("Key Insights", margin, y);
        y += 8;

        insights.forEach((insight, i) => {
          if (y > pageHeight - 30) {
            addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
            pdf.addPage();
            y = margin + 5;
          }
          pdf.setFillColor(196, 140, 86);
          pdf.circle(margin + 3, y - 1, 2.5, "F");
          pdf.setFontSize(7);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.text(String(i + 1), margin + 3, y + 0.5, { align: "center" });

          pdf.setFontSize(9);
          pdf.setTextColor(60, 55, 50);
          pdf.setFont("helvetica", "normal");
          const insightLines = pdf.splitTextToSize(insight, contentWidth - 12);
          pdf.text(insightLines, margin + 9, y);
          y += insightLines.length * 4 + 4;
        });
        y += 4;
      }

      setProgress(40);

      // ========== CHARTS PAGES ==========
      // Capture the dashboard charts
      const chartsContainer = dashboardRef.current;
      if (chartsContainer) {
        const chartElements = chartsContainer.querySelectorAll("[data-chart-card]");

        if (chartElements.length > 0) {
          addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
          pdf.addPage();
          y = margin;

          // Charts page header
          pdf.setFillColor(44, 40, 36);
          pdf.rect(0, 0, pageWidth, 15, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(255, 255, 255);
          pdf.text("Visualizations", margin, 10);
          y = 22;

          let chartIndex = 0;
          for (const el of Array.from(chartElements)) {
            setProgress(40 + Math.round((chartIndex / chartElements.length) * 40));

            try {
              const canvas = await html2canvas(el as HTMLElement, {
                scale: 2,
                backgroundColor: "#FFFFFF",
                useCORS: true,
                logging: false,
              });

              const imgData = canvas.toDataURL("image/png");
              const imgAspect = canvas.width / canvas.height;
              const imgWidth = Math.min(contentWidth, 170);
              const imgHeight = imgWidth / imgAspect;

              if (y + imgHeight > pageHeight - 25) {
                addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
                pdf.addPage();
                y = margin + 5;
              }

              pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
              y += imgHeight + 8;
            } catch (err) {
              console.error("Chart capture error:", err);
            }
            chartIndex++;
          }
        }
      }

      setProgress(85);

      // ========== STATISTICS PAGE ==========
      if (columnStats.length > 0) {
        addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
        pdf.addPage();
        let sy = margin;

        pdf.setFillColor(44, 40, 36);
        pdf.rect(0, 0, pageWidth, 15, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Column Statistics", margin, 10);
        sy = 22;

        // Table header
        const colWidths = [35, 18, 18, 16, 16, 22, 22, 18, 18];
        const headers = ["Column", "Type", "Count", "Missing", "Unique", "Min", "Max", "Mean", "Std Dev"];
        pdf.setFillColor(245, 240, 235);
        pdf.rect(margin, sy, contentWidth, 7, "F");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(80, 70, 60);
        let cx = margin + 2;
        headers.forEach((h, i) => {
          pdf.text(h, cx, sy + 5);
          cx += colWidths[i];
        });
        sy += 9;

        columnStats.forEach((col) => {
          if (sy > pageHeight - 25) {
            addFooter(pdf, pageWidth, pageHeight, margin, dateStr);
            pdf.addPage();
            sy = margin + 5;
          }
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 55, 50);
          let rx = margin + 2;
          const vals = [
            col.name.slice(0, 18),
            col.type,
            String(col.count),
            String(col.missing),
            String(col.unique),
            col.min !== undefined ? String(col.min) : "-",
            col.max !== undefined ? String(col.max) : "-",
            col.mean !== undefined ? String(col.mean) : "-",
            col.stddev !== undefined ? String(col.stddev) : "-",
          ];
          vals.forEach((v, i) => {
            pdf.text(v, rx, sy + 3);
            rx += colWidths[i];
          });
          // Row separator
          pdf.setDrawColor(220, 215, 210);
          pdf.setLineWidth(0.2);
          pdf.line(margin, sy + 5, margin + contentWidth, sy + 5);
          sy += 6;
        });
      }

      // Final footer
      addFooter(pdf, pageWidth, pageHeight, margin, dateStr);

      setProgress(90);

      // Generate PDF data
      const pdfOutput = pdf.output("datauristring");

      // Generate thumbnail from first page
      let thumbnailData = "";
      try {
        const coverEl = dashboardRef.current;
        if (coverEl) {
          const thumbCanvas = await html2canvas(coverEl, {
            scale: 0.5,
            backgroundColor: "#FFFFFF",
            useCORS: true,
            logging: false,
            width: 400,
            height: 300,
          });
          thumbnailData = thumbCanvas.toDataURL("image/png", 0.6);
        }
      } catch {
        // thumbnail generation is optional
      }

      // Auto-generate tags and description
      const autoTags = generateAutoTags(title, summary, insights, columnStats);
      const autoDescription = generateAutoDescription(title, summary, totalRows, totalColumns, chartCount);

      setProgress(95);

      // Save to API
      const saveRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Data Analysis Report",
          description: autoDescription,
          tags: autoTags,
          pdfData: pdfOutput,
          thumbnailData,
          chartCount,
          rowCount: totalRows,
          columnCount: totalColumns,
          dataSource,
        }),
      });

      if (saveRes.ok) {
        const result = await saveRes.json();
        setSaved(true);
        if (onReportSaved) onReportSaved(result.report?.id);

        // Also trigger download
        pdf.save(`${(title || "report").replace(/[^a-zA-Z0-9]/g, "_")}_${now.toISOString().split("T")[0]}.pdf`);
      }

      setProgress(100);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
      }, 1500);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
        saved
          ? "bg-[#6B8E6B] text-white"
          : generating
          ? "bg-[#C48C56]/50 text-white cursor-wait"
          : "bg-[#C48C56] text-white hover:bg-[#B07A48] hover:scale-[1.02]"
      }`}
      style={{ fontFamily: FN }}
    >
      {saved ? (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Report Saved
        </>
      ) : generating ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Generating... {progress}%
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6M9 15l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Generate PDF Report
        </>
      )}
    </button>
  );
}

function addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, dateStr: string) {
  pdf.setDrawColor(196, 140, 86);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(140, 130, 120);
  pdf.text("Made By Louati Mahdi", margin, pageHeight - 7);
  pdf.text(dateStr, pageWidth - margin, pageHeight - 7, { align: "right" });

  const pageNum = pdf.getNumberOfPages();
  pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 7, { align: "center" });
}
