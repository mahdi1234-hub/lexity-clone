"use client";

import React, { useRef, useEffect } from "react";

interface FrappeDataset {
  name: string;
  values: number[];
  chartType?: "bar" | "line";
}

interface FrappeChartWrapperProps {
  title?: string;
  type?: "bar" | "line" | "percentage" | "pie" | "heatmap";
  labels: string[];
  datasets: FrappeDataset[];
  height?: number;
  colors?: string[];
  barOptions?: { stacked?: boolean; spaceRatio?: number };
  lineOptions?: { dotSize?: number; regionFill?: number; hideDots?: boolean };
  axisOptions?: { xAxisMode?: string; yAxisMode?: string; xIsSeries?: boolean };
}

export default function FrappeChartWrapper({
  title = "Chart",
  type = "line",
  labels,
  datasets,
  height = 300,
  colors = ["#78c8b4", "#e8a87c", "#d4a5a5", "#8cc0de", "#c9b1ff"],
  barOptions,
  lineOptions = { dotSize: 4, regionFill: 1, hideDots: false },
  axisOptions = { xIsSeries: true },
}: FrappeChartWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !labels.length) return;

    const loadChart = async () => {
      try {
        const { Chart } = await import("frappe-charts");

        // Clear previous
        if (chartRef.current) {
          chartRef.current.innerHTML = "";
        }

        chartInstance.current = new Chart(chartRef.current, {
          title,
          data: {
            labels,
            datasets: datasets.map((ds) => ({
              name: ds.name,
              values: ds.values,
              chartType: ds.chartType || type,
            })),
          },
          type,
          height,
          colors,
          barOptions: barOptions || { stacked: false, spaceRatio: 0.5 },
          lineOptions: lineOptions || { dotSize: 4, regionFill: 1 },
          axisOptions: axisOptions || { xIsSeries: true },
          tooltipOptions: {
            formatTooltipX: (d: string) => d,
            formatTooltipY: (d: number) => d?.toFixed(2),
          },
        });
      } catch (err) {
        console.error("Failed to load chart library:", err);
      }
    };

    loadChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current = null;
      }
    };
  }, [title, type, labels, datasets, height, colors, barOptions, lineOptions, axisOptions]);

  return (
    <div className="w-full">
      <div
        ref={chartRef}
        className="frappe-chart-container"
        style={{
          minHeight: height,
        }}
      />
      <style jsx global>{`
        .frappe-chart-container .chart-container {
          font-family: "Cormorant Garamond", serif !important;
        }
        .frappe-chart-container .chart-container .title {
          fill: rgba(255, 255, 255, 0.7) !important;
          font-style: italic !important;
          font-size: 14px !important;
          letter-spacing: 0.05em !important;
        }
        .frappe-chart-container .chart-container .axis text,
        .frappe-chart-container .chart-container .chart-label {
          fill: rgba(255, 255, 255, 0.5) !important;
          font-size: 10px !important;
        }
        .frappe-chart-container .chart-container .axis line,
        .frappe-chart-container .chart-container .axis path {
          stroke: rgba(255, 255, 255, 0.08) !important;
        }
        .frappe-chart-container .graph-svg-tip {
          background: rgba(26, 28, 26, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 6px !important;
          color: rgba(255, 255, 255, 0.8) !important;
          font-family: "Cormorant Garamond", serif !important;
        }
        .frappe-chart-container .graph-svg-tip .title {
          fill: rgba(255, 255, 255, 0.8) !important;
        }
        .frappe-chart-container .dataset-units circle {
          stroke: rgba(26, 28, 26, 0.8) !important;
          stroke-width: 1.5 !important;
        }
        .frappe-chart-container .legend-dataset-text {
          fill: rgba(255, 255, 255, 0.6) !important;
          font-size: 11px !important;
        }
      `}</style>
    </div>
  );
}
