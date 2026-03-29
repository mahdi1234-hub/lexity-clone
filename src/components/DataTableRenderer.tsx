"use client";

import React, { useRef, useEffect } from "react";

export interface DataTableConfig {
  title?: string;
  description?: string;
  columns: Array<{
    key: string;
    label: string;
    type?: "text" | "number" | "sparkline" | "bar" | "badge" | "change";
    width?: number;
    align?: "left" | "center" | "right";
    format?: string; // e.g. "percent", "currency", "decimal"
  }>;
  rows: Array<Record<string, unknown>>;
  highlightMax?: boolean;
  highlightMin?: boolean;
  striped?: boolean;
  compact?: boolean;
}

// Tiny inline SVG sparkline
function Sparkline({ data, color = "#C48C56", width = 80, height = 24 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = color + "15";
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // End dot
    const lastX = width - padding;
    const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [data, color, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height }} />;
}

// Inline bar indicator
function InlineBar({ value, max, color = "#C48C56" }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden" style={{ minWidth: 40 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-[#2C2824]/60 tabular-nums" style={{ minWidth: 28, textAlign: "right" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// Change indicator (+/-%)
function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span className={`text-[11px] font-medium tabular-nums ${isPositive ? "text-[#6B8E6B]" : "text-[#C45640]"}`}>
      {isPositive ? "+" : ""}{typeof value === "number" ? value.toFixed(1) : value}%
    </span>
  );
}

// Badge
function Badge({ value, color }: { value: string; color?: string }) {
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: (color || "#C48C56") + "20", color: color || "#C48C56" }}
    >
      {value}
    </span>
  );
}

function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return "-";
  if (typeof value !== "number") return String(value);
  switch (format) {
    case "percent": return `${value.toFixed(1)}%`;
    case "currency": return `$${value.toLocaleString()}`;
    case "decimal": return value.toFixed(2);
    case "integer": return Math.round(value).toLocaleString();
    default: return typeof value === "number" ? value.toLocaleString() : String(value);
  }
}

export default function DataTableRenderer({ config }: { config: DataTableConfig }) {
  // Find max values for bar columns
  const maxValues: Record<string, number> = {};
  config.columns.forEach(col => {
    if (col.type === "bar") {
      const vals = config.rows.map(r => Number(r[col.key]) || 0);
      maxValues[col.key] = Math.max(...vals, 1);
    }
  });

  return (
    <div className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-[#C48C56]/15 overflow-hidden">
      {/* Header */}
      {config.title && (
        <div className="px-4 py-2.5 border-b border-black/5 bg-white/40">
          <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {config.title}
          </h3>
          {config.description && (
            <p className="text-[10px] text-[#8B7B6B] mt-0.5">{config.description}</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <thead>
            <tr className="border-b border-black/10 bg-white/30">
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-semibold text-[#2C2824]/70 whitespace-nowrap ${config.compact ? "py-1.5" : "py-2"}`}
                  style={{ textAlign: col.align || "left", width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-black/5 hover:bg-[#C48C56]/5 transition-colors ${
                  config.striped && rowIdx % 2 === 1 ? "bg-black/[0.02]" : ""
                }`}
              >
                {config.columns.map((col) => {
                  const value = row[col.key];
                  const cellClass = `px-3 ${config.compact ? "py-1.5" : "py-2"} text-[#2C2824]/80`;

                  switch (col.type) {
                    case "sparkline":
                      return (
                        <td key={col.key} className={cellClass} style={{ textAlign: col.align }}>
                          {Array.isArray(value) ? (
                            <Sparkline data={value as number[]} width={col.width || 80} height={20} />
                          ) : (
                            <span className="text-[#8B7B6B]">-</span>
                          )}
                        </td>
                      );
                    case "bar":
                      return (
                        <td key={col.key} className={cellClass} style={{ textAlign: col.align }}>
                          <InlineBar value={Number(value) || 0} max={maxValues[col.key]} />
                        </td>
                      );
                    case "change":
                      return (
                        <td key={col.key} className={cellClass} style={{ textAlign: col.align || "right" }}>
                          <ChangeIndicator value={Number(value) || 0} />
                        </td>
                      );
                    case "badge":
                      return (
                        <td key={col.key} className={cellClass} style={{ textAlign: col.align }}>
                          <Badge value={String(value)} />
                        </td>
                      );
                    case "number":
                      return (
                        <td key={col.key} className={`${cellClass} tabular-nums`} style={{ textAlign: col.align || "right" }}>
                          {formatValue(value, col.format)}
                        </td>
                      );
                    default:
                      return (
                        <td key={col.key} className={cellClass} style={{ textAlign: col.align }}>
                          {formatValue(value, col.format)}
                        </td>
                      );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
