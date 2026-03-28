"use client";

import { memo } from "react";
import dynamic from "next/dynamic";

const ResponsiveBar = dynamic(() => import("@nivo/bar").then((m) => m.ResponsiveBar), { ssr: false });
const ResponsiveLine = dynamic(() => import("@nivo/line").then((m) => m.ResponsiveLine), { ssr: false });
const ResponsivePie = dynamic(() => import("@nivo/pie").then((m) => m.ResponsivePie), { ssr: false });
const ResponsiveRadar = dynamic(() => import("@nivo/radar").then((m) => m.ResponsiveRadar), { ssr: false });

interface ChartWidgetProps {
  chartType: "bar" | "line" | "pie" | "radar";
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
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
    container: {
      background: "#2C2824",
      color: "#F2EFEA",
      fontSize: 11,
      borderRadius: 8,
      border: "1px solid #3D3530",
    },
  },
};

function ChartWidget({ chartType, title, description, data, config }: ChartWidgetProps) {
  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveBar
            data={data?.items || []}
            keys={data?.keys || ["value"]}
            indexBy={data?.indexBy || "label"}
            margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
            padding={0.3}
            colors={["#C48C56", "#7986CB", "#6B8E6B", "#BA68C8", "#4FC3F7"]}
            theme={theme}
            borderRadius={4}
            enableLabel={false}
            axisBottom={{ tickRotation: -30 }}
            {...config}
          />
        );
      case "line":
        return (
          <ResponsiveLine
            data={data?.series || []}
            margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
            colors={["#C48C56", "#7986CB", "#6B8E6B"]}
            theme={theme}
            pointSize={6}
            pointColor="#1A1714"
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea
            areaOpacity={0.1}
            useMesh
            {...config}
          />
        );
      case "pie":
        return (
          <ResponsivePie
            data={data?.items || []}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            innerRadius={0.5}
            padAngle={2}
            cornerRadius={4}
            colors={["#C48C56", "#7986CB", "#6B8E6B", "#BA68C8", "#4FC3F7", "#FFD54F"]}
            theme={theme}
            borderWidth={1}
            borderColor="#3D3530"
            arcLinkLabelsTextColor="#F2EFEA80"
            arcLinkLabelsColor="#3D3530"
            arcLabelsTextColor="#1A1714"
            {...config}
          />
        );
      case "radar":
        return (
          <ResponsiveRadar
            data={data?.items || []}
            keys={data?.keys || ["value"]}
            indexBy={data?.indexBy || "label"}
            margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
            colors={["#C48C56", "#7986CB"]}
            theme={theme}
            borderColor={{ from: "color" }}
            gridLabelOffset={12}
            dotSize={6}
            dotColor="#1A1714"
            dotBorderWidth={2}
            dotBorderColor={{ from: "color" }}
            fillOpacity={0.15}
            {...config}
          />
        );
      default:
        return <div className="text-xs text-[#F2EFEA]/40 text-center py-4">Unsupported chart type</div>;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl overflow-hidden" style={{ width: 380, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-[#F2EFEA]/90">{title}</span>
        </div>
        {description && <p className="text-[10px] text-[#F2EFEA]/40 mb-1">{description}</p>}
      </div>
      <div style={{ height: 220 }}>{renderChart()}</div>
    </div>
  );
}

export default memo(ChartWidget);
