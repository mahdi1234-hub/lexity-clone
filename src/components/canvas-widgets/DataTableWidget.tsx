"use client";

import { memo, useState, useMemo } from "react";

interface DataTableWidgetProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  columns?: string[];
  expanded?: boolean;
  onToggleExpand?: () => void;
}

function detectDataType(values: unknown[]): string {
  const sample = values.filter((v) => v != null && v !== "").slice(0, 10);
  if (sample.length === 0) return "text";

  const isNumber = sample.every((v) => !isNaN(Number(v)));
  if (isNumber) return "number";

  const isDate = sample.every((v) => !isNaN(Date.parse(String(v))));
  if (isDate) return "date";

  const isBool = sample.every((v) => ["true", "false", "0", "1", "yes", "no"].includes(String(v).toLowerCase()));
  if (isBool) return "boolean";

  const avgLen = sample.reduce((sum: number, v: unknown) => sum + String(v).length, 0) / sample.length;
  if (avgLen > 100) return "text-long";

  return "text";
}

const typeColors: Record<string, string> = {
  number: "#C48C56",
  date: "#4285F4",
  boolean: "#6B8E6B",
  text: "#F2EFEA",
  "text-long": "#BA68C8",
};

const typeBadges: Record<string, string> = {
  number: "NUM",
  date: "DATE",
  boolean: "BOOL",
  text: "TEXT",
  "text-long": "LONG",
};

function DataTableWidget({ title, data, columns: propColumns, expanded, onToggleExpand }: DataTableWidgetProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const width = expanded ? 700 : 420;

  const columns = useMemo(() => {
    if (propColumns) return propColumns;
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data, propColumns]);

  const columnTypes = useMemo(() => {
    const types: Record<string, string> = {};
    columns.forEach((col) => {
      const values = data.map((row) => row[col]);
      types[col] = detectDataType(values);
    });
    return types;
  }, [columns, data]);

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      const type = columnTypes[sortCol];
      if (type === "number") {
        return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
      return sortDir === "asc"
        ? String(aVal || "").localeCompare(String(bVal || ""))
        : String(bVal || "").localeCompare(String(aVal || ""));
    });
  }, [data, sortCol, sortDir, columnTypes]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  return (
    <div
      className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden"
      style={{ width, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#3D3530]/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
          <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
          <span className="text-[10px] text-[#F2EFEA]/30">{data.length} rows</span>
        </div>
        {onToggleExpand && (
          <button onClick={onToggleExpand} className="p-1 rounded hover:bg-white/10 transition-colors">
            <svg className="w-3.5 h-3.5 text-[#F2EFEA]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
            </svg>
          </button>
        )}
      </div>

      {/* Column type badges */}
      <div className="px-4 py-1.5 flex gap-2 overflow-x-auto border-b border-[#3D3530]/30">
        {columns.map((col) => (
          <div key={col} className="flex items-center gap-1 flex-shrink-0">
            <span
              className="text-[8px] font-bold px-1 py-0.5 rounded"
              style={{ backgroundColor: `${typeColors[columnTypes[col]] || typeColors.text}20`, color: typeColors[columnTypes[col]] || typeColors.text }}
            >
              {typeBadges[columnTypes[col]] || "TEXT"}
            </span>
            <span className="text-[9px] text-[#F2EFEA]/40 truncate max-w-[60px]">{col}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: expanded ? 400 : 240 }}>
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-[#2C2824]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2 text-left font-medium text-[#F2EFEA]/50 border-b border-[#3D3530] cursor-pointer hover:text-[#F2EFEA]/80 whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sortCol === col && (
                      <span className="text-[#C48C56]">{sortDir === "asc" ? "^" : "v"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.slice(0, expanded ? 50 : 20).map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 text-[#F2EFEA]/60 border-b border-[#3D3530]/20 whitespace-nowrap max-w-[150px] truncate">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > (expanded ? 50 : 20) && (
        <div className="px-4 py-2 text-center border-t border-[#3D3530]/30">
          <span className="text-[9px] text-[#F2EFEA]/20">Showing {expanded ? 50 : 20} of {data.length} rows</span>
        </div>
      )}
    </div>
  );
}

export default memo(DataTableWidget);
