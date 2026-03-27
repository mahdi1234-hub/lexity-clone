"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";

// Theme colors matching the SaaS UI
const THEME_BG = "#F2EFEA";
const THEME_FG = "#2C2824";
const THEME_ACCENT = "#C48C56";

const CHART_COLORS = [
  "#C48C56",
  "#8B6B4A",
  "#D4A574",
  "#A67B5B",
  "#E8C9A0",
  "#7A5C3E",
  "#BDA07D",
  "#6B4E35",
  "#C9A882",
  "#9E7E5C",
];

const nivoTheme = {
  background: "transparent",
  text: { fontSize: 12, fill: THEME_FG, fontFamily: "Plus Jakarta Sans, sans-serif" },
  axis: {
    domain: { line: { stroke: THEME_FG, strokeWidth: 1 } },
    legend: { text: { fontSize: 12, fill: THEME_FG, fontFamily: "Plus Jakarta Sans, sans-serif" } },
    ticks: {
      line: { stroke: THEME_FG, strokeWidth: 1 },
      text: { fontSize: 10, fill: THEME_FG, fontFamily: "Plus Jakarta Sans, sans-serif" },
    },
  },
  grid: { line: { stroke: "#D5D0C8", strokeWidth: 1 } },
  legends: { text: { fontSize: 11, fill: THEME_FG, fontFamily: "Plus Jakarta Sans, sans-serif" } },
  labels: { text: { fontSize: 11, fill: THEME_FG, fontFamily: "Plus Jakarta Sans, sans-serif" } },
  tooltip: {
    container: {
      background: THEME_BG,
      color: THEME_FG,
      fontSize: 12,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      fontFamily: "Plus Jakarta Sans, sans-serif",
    },
  },
};

interface ChartConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: string;
  width?: number;
  height?: number;
}

interface ColumnStat {
  name: string;
  type: string;
  count: number;
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stddev?: number;
  topValues?: { value: string; count: number }[];
}

interface NetworkGraphData {
  title: string;
  nodes: { id: string; label: string; category: string; size: number; description?: string }[];
  edges: { source: string; target: string; label: string; weight: number }[];
}

interface DashboardData {
  title: string;
  summary: string;
  insights: string[];
  charts: ChartConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: Record<string, any[]>;
  kpiValues: { label: string; value: string }[];
  networkData: NetworkGraphData | null;
  columnStats: ColumnStat[];
  totalRows: number;
  totalColumns: number;
  headers: string[];
}

interface EDADashboardProps {
  data: DashboardData;
  onClose: () => void;
}

function ChartCard({ title, description, children, wide }: { title: string; description: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`relative rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-4 ${wide ? "col-span-2" : "col-span-1"}`}
      style={{ minHeight: 320 }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#2C2824] font-[family-name:var(--font-plus-jakarta)]">{title}</h3>
        <p className="text-xs text-[#2C2824]/60 mt-0.5">{description}</p>
      </div>
      <div style={{ height: 250 }}>{children}</div>
    </div>
  );
}

function BarChart({ data }: { data: { category: string; value: number }[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  return (
    <ResponsiveBar
      data={data}
      keys={["value"]}
      indexBy="category"
      margin={{ top: 10, right: 20, bottom: 60, left: 60 }}
      padding={0.3}
      colors={CHART_COLORS}
      colorBy="indexValue"
      theme={nivoTheme}
      borderRadius={4}
      axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
      axisLeft={{ tickSize: 5, tickPadding: 5 }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      animate={true}
      motionConfig="gentle"
    />
  );
}

function LineChart({ data }: { data: { x: string; y: number }[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  const lineData = [{ id: "series", data: data.map((d) => ({ x: d.x, y: d.y })) }];
  return (
    <ResponsiveLine
      data={lineData}
      margin={{ top: 10, right: 20, bottom: 60, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", min: "auto", max: "auto" }}
      colors={[THEME_ACCENT]}
      theme={nivoTheme}
      pointSize={6}
      pointColor={THEME_ACCENT}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      enableGridX={false}
      axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
      axisLeft={{ tickSize: 5, tickPadding: 5 }}
      useMesh={true}
      animate={true}
      motionConfig="gentle"
    />
  );
}

function PieChart({ data }: { data: { id: string; label: string; value: number }[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  return (
    <ResponsivePie
      data={data}
      margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      colors={CHART_COLORS}
      theme={nivoTheme}
      borderWidth={1}
      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={THEME_FG}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsSkipAngle={10}
      animate={true}
      motionConfig="gentle"
    />
  );
}

function ScatterChart({ data }: { data: { x: number; y: number }[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  const scatterData = [{ id: "data", data }];
  return (
    <ResponsiveScatterPlot
      data={scatterData}
      margin={{ top: 10, right: 20, bottom: 60, left: 60 }}
      xScale={{ type: "linear", min: "auto", max: "auto" }}
      yScale={{ type: "linear", min: "auto", max: "auto" }}
      colors={[THEME_ACCENT]}
      theme={nivoTheme}
      blendMode="multiply"
      nodeSize={8}
      axisBottom={{ tickSize: 5, tickPadding: 5 }}
      axisLeft={{ tickSize: 5, tickPadding: 5 }}
      animate={true}
      motionConfig="gentle"
    />
  );
}

function RadarChart({ data }: { data: { metric: string; value: number }[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  return (
    <ResponsiveRadar
      data={data}
      keys={["value"]}
      indexBy="metric"
      maxValue="auto"
      margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
      colors={[THEME_ACCENT]}
      theme={nivoTheme}
      borderColor={{ from: "color" }}
      gridLabelOffset={16}
      dotSize={8}
      dotColor={{ theme: "background" }}
      dotBorderWidth={2}
      dotBorderColor={{ from: "color" }}
      blendMode="multiply"
      animate={true}
      motionConfig="gentle"
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HeatmapChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/50">No data available</div>;
  return (
    <ResponsiveHeatMap
      data={data}
      margin={{ top: 40, right: 20, bottom: 60, left: 80 }}
      theme={nivoTheme}
      colors={{
        type: "sequential",
        scheme: "oranges",
      }}
      axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
      axisLeft={{ tickSize: 5, tickPadding: 5 }}
      animate={true}
      motionConfig="gentle"
    />
  );
}

function NetworkGraph({ data }: { data: NetworkGraphData }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodePositions, svgEdges } = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const count = data.nodes.length;
    const centerX = 300;
    const centerY = 200;
    const radius = Math.min(centerX, centerY) * 0.7;

    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const edges = data.edges.map((edge) => ({
      ...edge,
      x1: positions[edge.source]?.x || 0,
      y1: positions[edge.source]?.y || 0,
      x2: positions[edge.target]?.x || 0,
      y2: positions[edge.target]?.y || 0,
    }));

    return { nodePositions: positions, svgEdges: edges };
  }, [data]);

  const getNodeColor = useCallback((nodeId: string) => {
    if (hoveredNode === nodeId) return THEME_ACCENT;
    if (hoveredNode) {
      const connected = data.edges.some(
        (e) => (e.source === hoveredNode && e.target === nodeId) || (e.target === hoveredNode && e.source === nodeId)
      );
      return connected ? THEME_ACCENT + "CC" : THEME_FG + "33";
    }
    return THEME_FG + "88";
  }, [hoveredNode, data.edges]);

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 600 400" className="w-full h-full">
        {svgEdges.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={
              hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode)
                ? THEME_ACCENT
                : THEME_FG + "22"
            }
            strokeWidth={Math.max(1, edge.weight * 0.5)}
          />
        ))}
        {data.nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={node.size * 1.5}
                fill={getNodeColor(node.id)}
                stroke={hoveredNode === node.id ? THEME_ACCENT : "transparent"}
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y + node.size * 1.5 + 14}
                textAnchor="middle"
                fontSize={9}
                fill={THEME_FG}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {node.label.length > 15 ? node.label.substring(0, 15) + "..." : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hoveredNode && (
        <div className="absolute top-2 right-2 bg-[#F2EFEA] border border-[#D5D0C8] rounded-lg p-2 text-xs shadow-lg max-w-[200px]">
          <p className="font-semibold text-[#2C2824]">{data.nodes.find((n) => n.id === hoveredNode)?.label}</p>
          {data.nodes.find((n) => n.id === hoveredNode)?.description && (
            <p className="text-[#2C2824]/60 mt-1">{data.nodes.find((n) => n.id === hoveredNode)?.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EDADashboard({ data, onClose }: EDADashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "network" | "stats">("overview");

  const renderChart = useCallback((chart: ChartConfig) => {
    const chartData = data.chartData[chart.id];
    if (!chartData) return null;

    const wide = chart.width === 2;

    switch (chart.type) {
      case "bar":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <BarChart data={chartData} />
          </ChartCard>
        );
      case "line":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <LineChart data={chartData} />
          </ChartCard>
        );
      case "pie":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <PieChart data={chartData} />
          </ChartCard>
        );
      case "scatter":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <ScatterChart data={chartData} />
          </ChartCard>
        );
      case "radar":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <RadarChart data={chartData} />
          </ChartCard>
        );
      case "heatmap":
        return (
          <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={wide}>
            <HeatmapChart data={chartData} />
          </ChartCard>
        );
      default:
        return null;
    }
  }, [data.chartData]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F2EFEA] overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F2EFEA]/95 backdrop-blur-sm border-b border-[#D5D0C8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2C2824] font-[family-name:var(--font-plus-jakarta)]">
              {data.title}
            </h1>
            <p className="text-sm text-[#2C2824]/60 mt-1">{data.totalRows.toLocaleString()} rows x {data.totalColumns} columns</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#2C2824]/10 rounded-lg p-1">
              {(["overview", "charts", "network", "stats"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-[#C48C56] text-white shadow-sm"
                      : "text-[#2C2824]/60 hover:text-[#2C2824]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2C2824]/10 transition-colors text-[#2C2824]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-5">
              <h2 className="text-sm font-semibold text-[#2C2824] mb-2">Summary</h2>
              <p className="text-sm text-[#2C2824]/80 leading-relaxed">{data.summary}</p>
            </div>

            {/* KPIs */}
            {data.kpiValues && data.kpiValues.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.kpiValues.map((kpi, i) => (
                  <div key={i} className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-4 text-center">
                    <p className="text-xs text-[#2C2824]/60 uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-bold text-[#C48C56] mt-1 font-[family-name:var(--font-plus-jakarta)]">{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Insights */}
            {data.insights && data.insights.length > 0 && (
              <div className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-5">
                <h2 className="text-sm font-semibold text-[#2C2824] mb-3">Key Insights</h2>
                <ul className="space-y-2">
                  {data.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#2C2824]/80">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C48C56]/20 text-[#C48C56] flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* First 4 charts preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.charts.slice(0, 4).map((chart) => renderChart(chart))}
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.charts.map((chart) => renderChart(chart))}
          </div>
        )}

        {/* Network Tab */}
        {activeTab === "network" && (
          <div className="space-y-4">
            {data.networkData ? (
              <div className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-5">
                <h2 className="text-sm font-semibold text-[#2C2824] mb-1">{data.networkData.title}</h2>
                <p className="text-xs text-[#2C2824]/60 mb-4">Hover over nodes to explore relationships. {data.networkData.nodes.length} nodes, {data.networkData.edges.length} connections.</p>
                <div style={{ height: 500 }}>
                  <NetworkGraph data={data.networkData} />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-12 text-center">
                <p className="text-sm text-[#2C2824]/50">No network graph data available for this dataset.</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#D5D0C8]">
                <h2 className="text-sm font-semibold text-[#2C2824]">Column Statistics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#D5D0C8] bg-[#2C2824]/5">
                      <th className="px-4 py-2 text-left font-medium text-[#2C2824]">Column</th>
                      <th className="px-4 py-2 text-left font-medium text-[#2C2824]">Type</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Count</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Missing</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Unique</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Min</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Max</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Mean</th>
                      <th className="px-4 py-2 text-right font-medium text-[#2C2824]">Std Dev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.columnStats.map((col, i) => (
                      <tr key={i} className="border-b border-[#D5D0C8]/50 hover:bg-[#C48C56]/5">
                        <td className="px-4 py-2 font-medium text-[#2C2824]">{col.name}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            col.type === "numeric" ? "bg-[#C48C56]/20 text-[#C48C56]" :
                            col.type === "categorical" ? "bg-blue-100 text-blue-700" :
                            col.type === "date" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.count.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.missing}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.unique.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.min !== undefined ? col.min.toLocaleString() : "-"}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.max !== undefined ? col.max.toLocaleString() : "-"}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.mean !== undefined ? col.mean.toLocaleString() : "-"}</td>
                        <td className="px-4 py-2 text-right text-[#2C2824]/70">{col.stddev !== undefined ? col.stddev.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Values for categorical columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.columnStats
                .filter((col) => col.topValues && col.topValues.length > 0)
                .map((col, i) => (
                  <div key={i} className="rounded-xl border border-[#D5D0C8] bg-[#F2EFEA]/80 backdrop-blur-sm p-4">
                    <h3 className="text-sm font-semibold text-[#2C2824] mb-2">Top Values: {col.name}</h3>
                    <div className="space-y-1.5">
                      {col.topValues!.slice(0, 8).map((tv, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="flex-1 text-xs text-[#2C2824]/70 truncate">{tv.value}</div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-[#2C2824]/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#C48C56] rounded-full"
                                style={{ width: `${(tv.count / col.topValues![0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#2C2824]/50 w-8 text-right">{tv.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
