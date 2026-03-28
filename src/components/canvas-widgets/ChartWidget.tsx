"use client";

import { memo, useState } from "react";
import dynamic from "next/dynamic";

const ResponsiveBar = dynamic(() => import("@nivo/bar").then((m) => m.ResponsiveBar), { ssr: false });
const ResponsiveLine = dynamic(() => import("@nivo/line").then((m) => m.ResponsiveLine), { ssr: false });
const ResponsivePie = dynamic(() => import("@nivo/pie").then((m) => m.ResponsivePie), { ssr: false });
const ResponsiveRadar = dynamic(() => import("@nivo/radar").then((m) => m.ResponsiveRadar), { ssr: false });
const ResponsiveHeatMap = dynamic(() => import("@nivo/heatmap").then((m) => m.ResponsiveHeatMap), { ssr: false });
const ResponsiveScatterPlot = dynamic(() => import("@nivo/scatterplot").then((m) => m.ResponsiveScatterPlot), { ssr: false });
const ResponsiveFunnel = dynamic(() => import("@nivo/funnel").then((m) => m.ResponsiveFunnel), { ssr: false });
const ResponsiveTreeMap = dynamic(() => import("@nivo/treemap").then((m) => m.ResponsiveTreeMap), { ssr: false });
const ResponsiveSunburst = dynamic(() => import("@nivo/sunburst").then((m) => m.ResponsiveSunburst), { ssr: false });
const ResponsiveRadialBar = dynamic(() => import("@nivo/radial-bar").then((m) => m.ResponsiveRadialBar), { ssr: false });
const ResponsiveStream = dynamic(() => import("@nivo/stream").then((m) => m.ResponsiveStream), { ssr: false });
const ResponsiveSwarmPlot = dynamic(() => import("@nivo/swarmplot").then((m) => m.ResponsiveSwarmPlot), { ssr: false });
const ResponsiveCalendar = dynamic(() => import("@nivo/calendar").then((m) => m.ResponsiveCalendar), { ssr: false });
const ResponsiveNetwork = dynamic(() => import("@nivo/network").then((m) => m.ResponsiveNetwork), { ssr: false });

const ALL_CHART_TYPES = [
  "bar", "line", "pie", "radar", "heatmap", "scatter", "funnel",
  "treemap", "sunburst", "radial-bar", "stream", "swarmplot", "calendar", "network"
] as const;

type ChartType = typeof ALL_CHART_TYPES[number];

interface ChartWidgetProps {
  chartType?: ChartType;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const theme = {
  background: "transparent",
  text: { fill: "#F2EFEA", fontSize: 10 },
  axis: {
    ticks: { text: { fill: "#F2EFEA80", fontSize: 9 } },
    legend: { text: { fill: "#F2EFEA80", fontSize: 10 } },
  },
  grid: { line: { stroke: "#3D353040" } },
  legends: { text: { fill: "#F2EFEA80", fontSize: 9 } },
  tooltip: {
    container: { background: "#2C2824", color: "#F2EFEA", fontSize: 11, borderRadius: 8, border: "1px solid #3D3530" },
  },
};

const colors = ["#C48C56", "#7986CB", "#6B8E6B", "#BA68C8", "#4FC3F7", "#FFD54F", "#FF8A65", "#A1887F"];

function ChartWidget({ chartType: initialType, title, description, data, config, expanded, onToggleExpand }: ChartWidgetProps) {
  const [chartType, setChartType] = useState<ChartType>(initialType || "bar");
  const width = expanded ? 700 : 380;
  const chartHeight = expanded ? 400 : 220;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderChart = (): any => {
    const margin = { top: 10, right: 10, bottom: 40, left: 40 };
    switch (chartType) {
      case "bar":
        return <ResponsiveBar data={data?.items || []} keys={data?.keys || ["value"]} indexBy={data?.indexBy || "label"} margin={margin} padding={0.3} colors={colors} theme={theme} borderRadius={4} enableLabel={false} axisBottom={{ tickRotation: -30 }} {...config} />;
      case "line":
        return <ResponsiveLine data={data?.series || []} margin={margin} colors={colors} theme={theme} pointSize={6} pointColor="#1A1714" pointBorderWidth={2} pointBorderColor={{ from: "serieColor" }} enableArea areaOpacity={0.1} useMesh {...config} />;
      case "pie":
        return <ResponsivePie data={data?.items || []} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} innerRadius={0.5} padAngle={2} cornerRadius={4} colors={colors} theme={theme} borderWidth={1} borderColor="#3D3530" arcLinkLabelsTextColor="#F2EFEA80" arcLinkLabelsColor="#3D3530" arcLabelsTextColor="#1A1714" {...config} />;
      case "radar":
        return <ResponsiveRadar data={data?.items || []} keys={data?.keys || ["value"]} indexBy={data?.indexBy || "label"} margin={{ top: 20, right: 40, bottom: 20, left: 40 }} colors={colors} theme={theme} borderColor={{ from: "color" }} dotSize={6} dotColor="#1A1714" dotBorderWidth={2} dotBorderColor={{ from: "color" }} fillOpacity={0.15} {...config} />;
      case "heatmap":
        return <ResponsiveHeatMap data={data?.items || []} margin={margin} colors={{ type: "sequential", scheme: "oranges" }} theme={theme} {...config} />;
      case "scatter":
        return <ResponsiveScatterPlot data={data?.series || [{ id: "data", data: data?.items || [] }]} margin={margin} colors={colors} theme={theme} nodeSize={8} {...config} />;
      case "funnel":
        return <ResponsiveFunnel data={data?.items || []} margin={margin} colors={colors} theme={theme} borderWidth={10} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }} labelColor="#1A1714" {...config} />;
      case "treemap":
        return <ResponsiveTreeMap data={data?.root || { name: "root", children: [] }} identity="name" value="value" margin={margin} colors={colors} theme={theme} borderWidth={2} borderColor="#3D3530" labelTextColor="#F2EFEA" {...config} />;
      case "sunburst":
        return <ResponsiveSunburst data={data?.root || { name: "root", children: [] }} id="name" value="value" margin={{ top: 10, right: 10, bottom: 10, left: 10 }} colors={colors} theme={theme} borderWidth={1} borderColor="#3D3530" {...config} />;
      case "radial-bar":
        return <ResponsiveRadialBar data={data?.items || []} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} colors={colors} theme={theme} padding={0.4} {...config} />;
      case "stream":
        return <ResponsiveStream data={data?.items || []} keys={data?.keys || ["value"]} margin={margin} colors={colors} theme={theme} {...config} />;
      case "swarmplot":
        return <ResponsiveSwarmPlot data={data?.items || []} groups={data?.groups || ["A"]} id="id" value="value" margin={margin} colors={colors} theme={theme} size={8} {...config} />;
      case "calendar":
        return <ResponsiveCalendar data={data?.items || []} from={data?.from || "2024-01-01"} to={data?.to || "2024-12-31"} margin={{ top: 10, right: 10, bottom: 10, left: 30 }} colors={["#C48C5620", "#C48C5640", "#C48C5680", "#C48C56"]} theme={theme} {...config} />;
      case "network":
        return <ResponsiveNetwork data={{ nodes: data?.nodes || [], links: data?.links || [] }} margin={margin} nodeColor={() => colors[0]} theme={theme} {...config} />;
      default:
        return <div className="text-xs text-[#F2EFEA]/40 text-center py-4">Select a chart type</div>;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <button onClick={onToggleExpand} className="p-1 rounded hover:bg-white/10 transition-colors" title={expanded ? "Collapse" : "Expand"}>
              <svg className="w-3.5 h-3.5 text-[#F2EFEA]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Chart type selector */}
      <div className="px-4 pb-2">
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          className="w-full bg-[#1A1714] border border-[#3D3530] rounded-lg px-2 py-1 text-[10px] text-[#F2EFEA]/70 focus:outline-none focus:border-[#C48C56]/40"
        >
          {ALL_CHART_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}</option>
          ))}
        </select>
        {description && <p className="text-[10px] text-[#F2EFEA]/40 mt-1">{description}</p>}
      </div>
      <div style={{ height: chartHeight }}>{renderChart()}</div>
    </div>
  );
}

export default memo(ChartWidget);
