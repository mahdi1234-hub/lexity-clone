"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveRadar } from "@nivo/radar";

interface ChartData {
  title: string;
  chartType: "bar" | "pie" | "line" | "radar";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: any;
  description?: string;
}

function ChartNode({ data, selected }: NodeProps & { data: ChartData }) {
  const d = data as unknown as ChartData;

  const renderChart = () => {
    switch (d.chartType) {
      case "bar":
        return (
          <ResponsiveBar
            data={d.chartData.items || []}
            keys={d.chartData.keys || ["value"]}
            indexBy={d.chartData.indexBy || "label"}
            margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
            padding={0.3}
            colors={{ scheme: "pastel1" }}
            borderRadius={4}
            axisBottom={{ tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            enableGridY={false}
            enableLabel={false}
            animate={true}
            theme={{
              text: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10 },
              axis: { ticks: { text: { fill: "#2C2824", opacity: 0.4 } } },
            }}
          />
        );
      case "pie":
        return (
          <ResponsivePie
            data={d.chartData.items || []}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            innerRadius={0.5}
            padAngle={2}
            cornerRadius={4}
            colors={{ scheme: "pastel1" }}
            borderWidth={0}
            enableArcLabels={false}
            enableArcLinkLabels={true}
            arcLinkLabelsTextColor="#2C2824"
            arcLinkLabelsColor={{ from: "color" }}
            theme={{
              text: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10 },
            }}
          />
        );
      case "line":
        return (
          <ResponsiveLine
            data={d.chartData.series || []}
            margin={{ top: 10, right: 20, bottom: 30, left: 40 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            curve="natural"
            colors={{ scheme: "pastel1" }}
            pointSize={6}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea={true}
            areaOpacity={0.1}
            axisBottom={{ tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            enableGridX={false}
            enableGridY={false}
            theme={{
              text: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10 },
              axis: { ticks: { text: { fill: "#2C2824", opacity: 0.4 } } },
            }}
          />
        );
      case "radar":
        return (
          <ResponsiveRadar
            data={d.chartData.items || []}
            keys={d.chartData.keys || ["value"]}
            indexBy={d.chartData.indexBy || "label"}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            colors={{ scheme: "pastel1" }}
            borderWidth={2}
            dotSize={6}
            dotBorderWidth={2}
            gridLevels={3}
            theme={{
              text: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10 },
            }}
          />
        );
      default:
        return <div className="text-xs text-[#2C2824]/40 text-center">Unknown chart type</div>;
    }
  };

  return (
    <div
      className={`group relative rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-200 ${
        selected ? "ring-2 ring-[#C48C56]/60 shadow-xl" : "hover:shadow-xl"
      } bg-white/90 border border-black/5`}
      style={{ width: 340, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#6B8E6B] !w-2 !h-2 !border-2 !border-white" />

      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-[#6B8E6B]/10 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#6B8E6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h3 className="text-xs font-medium text-[#2C2824]/70">{d.title}</h3>
      </div>

      <div className="px-2 pb-2" style={{ height: 200 }}>
        {renderChart()}
      </div>

      {d.description && (
        <div className="px-4 pb-3 border-t border-black/5 pt-2">
          <p className="text-[10px] text-[#2C2824]/40">{d.description}</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#6B8E6B] !w-2 !h-2 !border-2 !border-white" />
    </div>
  );
}

export default memo(ChartNode);
