"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";

const ReportGenerator = dynamic(() => import("./ReportGenerator"), { ssr: false });
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveWaffle } from "@nivo/waffle";
import { ResponsiveBump } from "@nivo/bump";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveBoxPlot } from "@nivo/boxplot";
import { ResponsiveParallelCoordinates } from "@nivo/parallel-coordinates";
import { ResponsiveNetwork } from "@nivo/network";

const THEME_FG = "#2C2824";
const THEME_ACCENT = "#C48C56";
const FN = "Plus Jakarta Sans, sans-serif";

const CHART_COLORS = [
  "#C48C56", "#E8976B", "#6B8E6B", "#7B9EA8", "#9B7BA8",
  "#D4A574", "#8B7355", "#A67B5B", "#5B8A72", "#B07A48",
  "#7A5C3E", "#BDA07D", "#6B4E35", "#C9A882", "#9E7E5C",
  "#E8C9A0", "#8B6B4A", "#D99058", "#4E8B7A", "#A86B5B",
];

const nivoTheme = {
  background: "transparent",
  text: { fontSize: 11, fill: THEME_FG, fontFamily: FN },
  axis: {
    domain: { line: { stroke: THEME_FG + "44", strokeWidth: 1 } },
    legend: { text: { fontSize: 11, fill: THEME_FG, fontFamily: FN } },
    ticks: {
      line: { stroke: THEME_FG + "33", strokeWidth: 1 },
      text: { fontSize: 9, fill: THEME_FG + "99", fontFamily: FN },
    },
  },
  grid: { line: { stroke: "#D5D0C8", strokeWidth: 1, strokeDasharray: "4 4" } },
  legends: { text: { fontSize: 10, fill: THEME_FG, fontFamily: FN } },
  labels: { text: { fontSize: 10, fill: THEME_FG, fontFamily: FN } },
  tooltip: {
    container: {
      background: "#fff",
      color: THEME_FG,
      fontSize: 12,
      borderRadius: "10px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
      fontFamily: FN,
      padding: "8px 12px",
      border: "1px solid " + THEME_FG + "11",
    },
  },
};

interface ChartConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  width?: number;
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
  chartData: Record<string, any>;
  kpiValues: { label: string; value: string }[];
  networkData: NetworkGraphData | null;
  columnStats: ColumnStat[];
  totalRows: number;
  totalColumns: number;
  headers: string[];
}

interface EDADashboardProps {
  data: DashboardData;
  onClose?: () => void;
  inline?: boolean;
}

function ChartCard({ title, description, children, wide }: { title: string; description: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div data-chart-card className={"relative rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-4 transition-all hover:shadow-lg hover:border-[#C48C56]/30 " + (wide ? "col-span-2" : "col-span-1")} style={{ minHeight: 340 }}>
      <div className="mb-3">
        <h3 className="text-xs font-bold text-[#2C2824] uppercase tracking-wider" style={{ fontFamily: FN }}>{title}</h3>
        <p className="text-[10px] text-[#2C2824]/50 mt-0.5" style={{ fontFamily: FN }}>{description}</p>
      </div>
      <div style={{ height: 270 }}>{children}</div>
    </div>
  );
}

function NoData() {
  return (
    <div className="flex items-center justify-center h-full text-sm text-[#2C2824]/40" style={{ fontFamily: FN }}>
      <div className="text-center">
        <svg className="w-8 h-8 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        No data available
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function BarChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveBar data={data} keys={["value"]} indexBy="category" margin={{ top: 10, right: 20, bottom: 60, left: 60 }} padding={0.35} colors={CHART_COLORS} colorBy="indexValue" theme={nivoTheme} borderRadius={6} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} labelSkipWidth={16} labelSkipHeight={16} labelTextColor={{ from: "color", modifiers: [["darker", 2]] }} animate={true} motionConfig="gentle" enableGridY={true} />;
}

function LineChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  const ld = [{ id: "series", data: data.map(d => ({ x: d.x, y: d.y })) }];
  return <ResponsiveLine data={ld} margin={{ top: 10, right: 20, bottom: 60, left: 60 }} xScale={{ type: "point" }} yScale={{ type: "linear", min: "auto", max: "auto" }} colors={[THEME_ACCENT]} theme={nivoTheme} pointSize={7} pointColor="#fff" pointBorderWidth={2} pointBorderColor={THEME_ACCENT} enableArea={true} areaOpacity={0.1} enableGridX={false} curve="monotoneX" axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} useMesh={true} animate={true} motionConfig="gentle" />;
}

function PieChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsivePie data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }} innerRadius={0.55} padAngle={1.5} cornerRadius={6} colors={CHART_COLORS} theme={nivoTheme} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.2]] }} arcLinkLabelsSkipAngle={12} arcLinkLabelsTextColor={THEME_FG} arcLinkLabelsThickness={1.5} arcLinkLabelsColor={{ from: "color" }} arcLabelsSkipAngle={12} arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.5]] }} activeOuterRadiusOffset={6} animate={true} motionConfig="gentle" />;
}

function ScatterChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveScatterPlot data={[{ id: "data", data }]} margin={{ top: 10, right: 20, bottom: 60, left: 60 }} xScale={{ type: "linear", min: "auto", max: "auto" }} yScale={{ type: "linear", min: "auto", max: "auto" }} colors={[THEME_ACCENT]} theme={nivoTheme} blendMode="multiply" nodeSize={9} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} animate={true} motionConfig="gentle" />;
}

function RadarChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveRadar data={data} keys={["value"]} indexBy="metric" maxValue="auto" margin={{ top: 40, right: 60, bottom: 40, left: 60 }} colors={[THEME_ACCENT]} theme={nivoTheme} borderColor={{ from: "color" }} gridLabelOffset={20} dotSize={8} dotColor="#fff" dotBorderWidth={2} dotBorderColor={{ from: "color" }} fillOpacity={0.2} blendMode="multiply" animate={true} motionConfig="gentle" />;
}

function HeatmapChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveHeatMap data={data} margin={{ top: 40, right: 20, bottom: 60, left: 80 }} theme={nivoTheme} colors={{ type: "sequential", scheme: "oranges" }} axisTop={{ tickSize: 0, tickPadding: 5, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 5 }} animate={true} motionConfig="gentle" borderRadius={4} borderWidth={1} borderColor="#fff" />;
}

function SunburstChart({ data }: { data: any }) {
  if (!data?.children?.length) return <NoData />;
  return <ResponsiveSunburst data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} id="name" value="value" cornerRadius={4} borderWidth={2} borderColor="#fff" colors={CHART_COLORS} theme={nivoTheme} childColor={{ from: "color", modifiers: [["brighter", 0.3]] }} enableArcLabels={true} arcLabelsSkipAngle={12} arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.5]] }} animate={true} motionConfig="gentle" />;
}

function TreemapChart({ data }: { data: any }) {
  if (!data?.children?.length) return <NoData />;
  return <ResponsiveTreeMap data={data} identity="name" value="value" margin={{ top: 5, right: 5, bottom: 5, left: 5 }} colors={CHART_COLORS} theme={nivoTheme} borderWidth={2} borderColor="#fff" labelSkipSize={32} labelTextColor={{ from: "color", modifiers: [["darker", 2.5]] }} parentLabelTextColor={{ from: "color", modifiers: [["darker", 3]] }} animate={true} motionConfig="gentle" innerPadding={3} outerPadding={3} nodeOpacity={0.85} />;
}

function WaffleChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveWaffle total={data.reduce((s: number, d: any) => s + d.value, 0)} data={data} rows={14} columns={18} margin={{ top: 10, right: 10, bottom: 40, left: 10 }} colors={CHART_COLORS} theme={nivoTheme} borderRadius={3} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} animate={true} motionConfig="gentle" legends={[{ anchor: "bottom" as const, direction: "row" as const, justify: false, translateX: 0, translateY: 30, itemsSpacing: 4, itemWidth: 80, itemHeight: 14, itemDirection: "left-to-right" as const, itemOpacity: 0.85, itemTextColor: THEME_FG, symbolSize: 12, symbolShape: "circle" as const }]} />;
}

function BumpChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveBump data={data} margin={{ top: 20, right: 100, bottom: 40, left: 60 }} colors={CHART_COLORS} theme={nivoTheme} lineWidth={3} activeLineWidth={5} inactiveLineWidth={2} inactiveOpacity={0.3} pointSize={8} activePointSize={12} inactivePointSize={4} pointColor={{ theme: "background" }} pointBorderWidth={2} pointBorderColor={{ from: "serie.color" }} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} animate={true} motionConfig="gentle" />;
}

function CalendarChart({ data, from, to }: { data: any[]; from: string; to: string }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveCalendar data={data} from={from} to={to} emptyColor="#F5F0EB" colors={["#E8C9A0", "#D4A574", "#C48C56", "#A67B5B", "#7A5C3E"]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} theme={nivoTheme} monthBorderColor="#fff" dayBorderWidth={2} dayBorderColor="#fff" yearSpacing={40} monthSpacing={4} />;
}

function SankeyChart({ data }: { data: any }) {
  if (!data?.nodes?.length) return <NoData />;
  return <ResponsiveSankey data={data} margin={{ top: 20, right: 130, bottom: 20, left: 20 }} align="justify" colors={CHART_COLORS} theme={nivoTheme} nodeOpacity={1} nodeHoverOthersOpacity={0.35} nodeThickness={16} nodeSpacing={20} nodeBorderWidth={1} nodeBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }} nodeBorderRadius={4} linkOpacity={0.4} linkHoverOthersOpacity={0.1} linkContract={3} enableLinkGradient={true} labelPosition="outside" labelOrientation="vertical" labelPadding={12} labelTextColor={{ from: "color", modifiers: [["darker", 1.2]] }} animate={true} motionConfig="gentle" />;
}

function StreamChart({ data, keys }: { data: any[]; keys: string[] }) {
  if (!data?.length || !keys?.length) return <NoData />;
  return <ResponsiveStream data={data} keys={keys} margin={{ top: 20, right: 100, bottom: 40, left: 60 }} colors={CHART_COLORS} theme={nivoTheme} fillOpacity={0.85} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} enableGridX={false} curve="basis" offsetType="diverging" animate={true} motionConfig="gentle" legends={[{ anchor: "bottom-right" as const, direction: "column" as const, translateX: 100, itemWidth: 80, itemHeight: 20, itemTextColor: THEME_FG, symbolSize: 12, symbolShape: "circle" as const }]} />;
}

function MarimekkoChart({ data, dimensions }: { data: any[]; dimensions: { id: string; value: string }[] }) {
  if (!data?.length || !dimensions?.length) return <NoData />;
  return <ResponsiveMarimekko data={data} id="id" value="value" dimensions={dimensions} margin={{ top: 20, right: 60, bottom: 40, left: 60 }} colors={CHART_COLORS} theme={nivoTheme} innerPadding={4} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} animate={true} motionConfig="gentle" borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} />;
}

function SwarmPlotChart({ data, groups }: { data: any[]; groups: string[] }) {
  if (!data?.length || !groups?.length) return <NoData />;
  return <ResponsiveSwarmPlot data={data} groups={groups} value="value" size={8} margin={{ top: 20, right: 40, bottom: 60, left: 60 }} colors={CHART_COLORS} theme={nivoTheme} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.6]] }} enableGridY={true} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} animate={true} motionConfig="gentle" />;
}

function CirclePackingChart({ data }: { data: any }) {
  if (!data?.children?.length) return <NoData />;
  return <ResponsiveCirclePacking data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} id="name" value="value" colors={CHART_COLORS} theme={nivoTheme} padding={4} enableLabels={true} labelsSkipRadius={20} labelTextColor={{ from: "color", modifiers: [["darker", 2.5]] }} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} animate={true} motionConfig="gentle" />;
}

function RadialBarChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveRadialBar data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} colors={CHART_COLORS} theme={nivoTheme} padding={0.4} cornerRadius={4} enableRadialGrid={true} enableCircularGrid={true} radialAxisStart={{ tickSize: 0, tickPadding: 8 }} animate={true} motionConfig="gentle" />;
}

function FunnelChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveFunnel data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} colors={CHART_COLORS} theme={nivoTheme} borderWidth={2} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} labelColor={{ from: "color", modifiers: [["darker", 2.5]] }} enableBeforeSeparators={true} enableAfterSeparators={true} beforeSeparatorLength={40} beforeSeparatorOffset={20} afterSeparatorLength={40} afterSeparatorOffset={20} currentPartSizeExtension={10} currentBorderWidth={30} animate={true} motionConfig="gentle" shapeBlending={0.7} spacing={3} interpolation="smooth" />;
}

function BoxPlotChart({ data }: { data: any[] }) {
  if (!data?.length) return <NoData />;
  return <ResponsiveBoxPlot data={data} margin={{ top: 20, right: 20, bottom: 60, left: 60 }} colors={CHART_COLORS} borderRadius={4} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} medianWidth={3} medianColor={{ from: "color", modifiers: [["darker", 1.5]] }} whiskerWidth={2} whiskerEndSize={0.5} whiskerColor={{ from: "color", modifiers: [["darker", 0.6]] }} animate={true} motionConfig="gentle" axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }} />;
}

function ParallelCoordinatesChart({ data, variables }: { data: any[]; variables: any[] }) {
  if (!data?.length || !variables?.length) return <NoData />;
  return <ResponsiveParallelCoordinates data={data} variables={variables} margin={{ top: 20, right: 80, bottom: 20, left: 80 }} colors={CHART_COLORS} theme={nivoTheme} lineOpacity={0.5} animate={true} motionConfig="gentle" />;
}

function NetworkChartNivo({ data }: { data: any }) {
  if (!data?.nodes?.length) return <NoData />;
  return <ResponsiveNetwork data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} repulsivity={300} iterations={60} nodeColor={(n: any) => CHART_COLORS[Math.abs(String(n.id).charCodeAt(0)) % CHART_COLORS.length]} nodeBorderWidth={1} nodeBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }} linkThickness={2} linkColor={{ from: "source.color", modifiers: [["opacity", 0.4]] }} animate={true} motionConfig="gentle" />;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function SigmaNetworkGraph({ data }: { data: NetworkGraphData }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { nodePositions, svgEdges } = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const count = data.nodes.length;
    const cx = 400, cy = 300, radius = Math.min(cx, cy) * 0.7;
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count;
      const jitter = Math.sin(i * 7) * 30;
      positions[node.id] = { x: cx + (radius + jitter) * Math.cos(angle), y: cy + (radius + jitter) * Math.sin(angle) };
    });
    const edges = data.edges.map(edge => ({ ...edge, x1: positions[edge.source]?.x || 0, y1: positions[edge.source]?.y || 0, x2: positions[edge.target]?.x || 0, y2: positions[edge.target]?.y || 0 }));
    return { nodePositions: positions, svgEdges: edges };
  }, [data]);
  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 800 600" className="w-full h-full">
        <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {svgEdges.map((edge, i) => {
          const hl = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
          return <line key={i} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke={hl ? THEME_ACCENT : THEME_FG + "15"} strokeWidth={hl ? Math.max(2, edge.weight) : Math.max(1, edge.weight * 0.5)} opacity={hoveredNode && !hl ? 0.1 : 1} strokeLinecap="round" />;
        })}
        {data.nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const isH = hoveredNode === node.id;
          const isC = hoveredNode ? data.edges.some(e => (e.source === hoveredNode && e.target === node.id) || (e.target === hoveredNode && e.source === node.id)) : false;
          const ci = Math.abs(node.id.charCodeAt(node.id.length - 1)) % CHART_COLORS.length;
          return (
            <g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: "pointer" }}>
              <circle cx={pos.x} cy={pos.y} r={isH ? node.size * 2 : node.size * 1.5} fill={isH ? THEME_ACCENT : isC ? CHART_COLORS[ci] : hoveredNode ? THEME_FG + "22" : CHART_COLORS[ci]} stroke={isH ? THEME_ACCENT : "transparent"} strokeWidth={2} filter={isH ? "url(#glow)" : undefined} opacity={hoveredNode && !isH && !isC ? 0.3 : 1} />
              <text x={pos.x} y={pos.y + node.size * 1.5 + 14} textAnchor="middle" fontSize={isH ? 11 : 9} fill={isH ? THEME_ACCENT : THEME_FG} fontFamily={FN} fontWeight={isH ? "600" : "400"} opacity={hoveredNode && !isH && !isC ? 0.2 : 0.8}>
                {node.label.length > 18 ? node.label.substring(0, 18) + "..." : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hoveredNode && (() => {
        const nd = data.nodes.find(n => n.id === hoveredNode);
        return (
          <div className="absolute top-3 right-3 bg-white/95 border border-[#D5D0C8] rounded-xl p-3 text-xs shadow-xl max-w-[220px] backdrop-blur-sm">
            <p className="font-bold text-[#2C2824] mb-1" style={{ fontFamily: FN }}>{nd?.label}</p>
            <p className="text-[#C48C56] text-[10px] uppercase tracking-wider mb-1">{nd?.category}</p>
            {nd?.description && <p className="text-[#2C2824]/60 mt-1">{nd.description}</p>}
            <p className="text-[#2C2824]/40 mt-1">{data.edges.filter(e => e.source === hoveredNode || e.target === hoveredNode).length} connections</p>
          </div>
        );
      })()}
    </div>
  );
}

export default function EDADashboard({ data, onClose, inline }: EDADashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "network" | "stats">("overview");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const renderChart = useCallback((chart: ChartConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cd: any = data.chartData?.[chart.id];
    if (!cd) return null;
    const w = chart.width === 2;
    switch (chart.type) {
      case "bar": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><BarChart data={cd} /></ChartCard>;
      case "line": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><LineChart data={cd} /></ChartCard>;
      case "pie": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><PieChart data={cd} /></ChartCard>;
      case "scatter": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><ScatterChart data={cd} /></ChartCard>;
      case "radar": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><RadarChart data={cd} /></ChartCard>;
      case "heatmap": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><HeatmapChart data={cd} /></ChartCard>;
      case "sunburst": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><SunburstChart data={cd} /></ChartCard>;
      case "treemap": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><TreemapChart data={cd} /></ChartCard>;
      case "waffle": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><WaffleChart data={cd} /></ChartCard>;
      case "bump": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><BumpChart data={cd} /></ChartCard>;
      case "calendar": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={true}><CalendarChart data={cd} from={cd[0]?.day || "2024-01-01"} to={cd[cd.length - 1]?.day || "2024-12-31"} /></ChartCard>;
      case "sankey": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={true}><SankeyChart data={cd} /></ChartCard>;
      case "stream": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={true}><StreamChart data={cd.data || cd} keys={cd.keys || Object.keys((cd.data || cd)[0] || {}).filter((k: string) => k !== "keys")} /></ChartCard>;
      case "marimekko": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><MarimekkoChart data={cd.data || cd} dimensions={cd.dimensions || []} /></ChartCard>;
      case "swarmplot": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><SwarmPlotChart data={cd.data || cd} groups={cd.groups || []} /></ChartCard>;
      case "circlepacking": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><CirclePackingChart data={cd} /></ChartCard>;
      case "radialbar": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><RadialBarChart data={cd} /></ChartCard>;
      case "funnel": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><FunnelChart data={cd} /></ChartCard>;
      case "boxplot": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><BoxPlotChart data={cd} /></ChartCard>;
      case "parallelcoordinates": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={true}><ParallelCoordinatesChart data={cd.data || cd} variables={cd.variables || []} /></ChartCard>;
      case "network": return <ChartCard key={chart.id} title={chart.title} description={chart.description} wide={w}><NetworkChartNivo data={cd} /></ChartCard>;
      default: return null;
    }
  }, [data.chartData]);

  const cClass = inline ? "w-full bg-[#F2EFEA]/60 rounded-2xl border border-[#D5D0C8]/40 backdrop-blur-sm overflow-hidden" : "fixed inset-0 z-50 bg-[#F2EFEA] overflow-auto";

  return (
    <div className={cClass} ref={dashboardRef}>
      <div className={(inline ? "" : "sticky top-0 z-10 ") + "bg-[#F2EFEA]/95 backdrop-blur-sm border-b border-[#D5D0C8]/60"}>
        <div className={(inline ? "px-4 py-3" : "max-w-7xl mx-auto px-6 py-4") + " flex items-center justify-between"}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C48C56] to-[#A67B5B] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
            </div>
            <div>
              <h1 className={(inline ? "text-sm" : "text-lg") + " font-bold text-[#2C2824]"} style={{ fontFamily: FN }}>{data.title}</h1>
              <p className="text-[10px] text-[#2C2824]/50">{data.totalRows?.toLocaleString()} rows &middot; {data.totalColumns} columns &middot; {data.charts?.length} visualizations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReportGenerator
              dashboardRef={dashboardRef}
              title={data.title}
              summary={data.summary}
              insights={data.insights || []}
              kpiValues={data.kpiValues || []}
              columnStats={data.columnStats || []}
              totalRows={data.totalRows || 0}
              totalColumns={data.totalColumns || 0}
              chartCount={data.charts?.length || 0}
              dataSource="CSV Upload"
            />
            <div className="flex bg-[#2C2824]/10 rounded-lg p-0.5">
              {(["overview", "charts", "network", "stats"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={"px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all uppercase tracking-wider " + (activeTab === tab ? "bg-[#C48C56] text-white shadow-sm" : "text-[#2C2824]/50 hover:text-[#2C2824]")} style={{ fontFamily: FN }}>{tab}</button>
              ))}
            </div>
            {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#2C2824]/10 transition-colors text-[#2C2824]/50 hover:text-[#2C2824]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>}
          </div>
        </div>
      </div>
      <div className={inline ? "p-4" : "max-w-7xl mx-auto px-6 py-6"}>
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#C48C56]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#2C2824] uppercase tracking-wider mb-1" style={{ fontFamily: FN }}>Summary</h2>
                  <p className="text-xs text-[#2C2824]/70 leading-relaxed" style={{ fontFamily: FN }}>{data.summary}</p>
                </div>
              </div>
            </div>
            {data.kpiValues?.length > 0 && (
              <div className={"grid " + (inline ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5") + " gap-3"}>
                {data.kpiValues.map((kpi, i) => (
                  <div key={i} className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-3 text-center hover:shadow-md transition-shadow hover:border-[#C48C56]/30">
                    <p className="text-[9px] text-[#2C2824]/50 uppercase tracking-widest font-semibold" style={{ fontFamily: FN }}>{kpi.label}</p>
                    <p className="text-xl font-bold text-[#C48C56] mt-0.5" style={{ fontFamily: FN }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}
            {data.insights?.length > 0 && (
              <div className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-4">
                <h2 className="text-xs font-bold text-[#2C2824] uppercase tracking-wider mb-2" style={{ fontFamily: FN }}>Key Insights</h2>
                <ul className="space-y-1.5">
                  {data.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#2C2824]/70" style={{ fontFamily: FN }}>
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-[#C48C56] to-[#A67B5B] text-white flex items-center justify-center text-[9px] font-bold mt-0.5">{i + 1}</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.charts?.slice(0, 6).map(chart => renderChart(chart))}
            </div>
          </div>
        )}
        {activeTab === "charts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.charts?.map(chart => renderChart(chart))}
          </div>
        )}
        {activeTab === "network" && (
          <div className="space-y-4">
            {data.networkData ? (
              <div className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#C48C56]/15 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#2C2824] uppercase tracking-wider" style={{ fontFamily: FN }}>{data.networkData.title}</h2>
                    <p className="text-[10px] text-[#2C2824]/50">{data.networkData.nodes.length} nodes &middot; {data.networkData.edges.length} connections</p>
                  </div>
                </div>
                <div style={{ height: inline ? 400 : 500 }}><SigmaNetworkGraph data={data.networkData} /></div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-12 text-center">
                <p className="text-xs text-[#2C2824]/40" style={{ fontFamily: FN }}>No network data available for this dataset.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#D5D0C8]/60 bg-[#2C2824]/5">
                <h2 className="text-xs font-bold text-[#2C2824] uppercase tracking-wider" style={{ fontFamily: FN }}>Column Statistics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ fontFamily: FN }}>
                  <thead>
                    <tr className="border-b border-[#D5D0C8]/50 bg-[#2C2824]/3">
                      {["Column","Type","Count","Missing","Unique","Min","Max","Mean","Std Dev"].map(h => (
                        <th key={h} className={"px-3 py-2 font-semibold text-[#2C2824]/70 uppercase tracking-wider text-[10px] " + (h === "Column" || h === "Type" ? "text-left" : "text-right")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.columnStats?.map((col, i) => (
                      <tr key={i} className="border-b border-[#D5D0C8]/30 hover:bg-[#C48C56]/5 transition-colors">
                        <td className="px-3 py-2 font-semibold text-[#2C2824]">{col.name}</td>
                        <td className="px-3 py-2"><span className={"inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider " + (col.type === "numeric" ? "bg-[#C48C56]/15 text-[#C48C56]" : col.type === "categorical" ? "bg-[#7B9EA8]/15 text-[#7B9EA8]" : "bg-[#6B8E6B]/15 text-[#6B8E6B]")}>{col.type}</span></td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.count?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.missing}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.unique?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.min !== undefined ? col.min.toLocaleString() : "-"}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.max !== undefined ? col.max.toLocaleString() : "-"}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.mean !== undefined ? col.mean.toLocaleString() : "-"}</td>
                        <td className="px-3 py-2 text-right text-[#2C2824]/60">{col.stddev !== undefined ? col.stddev.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.columnStats?.filter(col => col.topValues?.length).map((col, i) => (
                <div key={i} className="rounded-xl border border-[#D5D0C8]/60 bg-white/60 backdrop-blur-sm p-3">
                  <h3 className="text-[10px] font-bold text-[#2C2824] uppercase tracking-wider mb-2" style={{ fontFamily: FN }}>Top Values: {col.name}</h3>
                  <div className="space-y-1">
                    {col.topValues!.slice(0, 8).map((tv, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="flex-1 text-[10px] text-[#2C2824]/60 truncate" style={{ fontFamily: FN }}>{tv.value}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-[#2C2824]/8 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#C48C56] to-[#D4A574] rounded-full" style={{ width: (tv.count / col.topValues![0].count) * 100 + "%" }} /></div>
                          <span className="text-[9px] text-[#2C2824]/40 w-6 text-right font-medium">{tv.count}</span>
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
