"use client";

import React, { useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveSankey } from "@nivo/sankey";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveNetwork } from "@nivo/network";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

// ─── Types ──────────────────────────────────────────────────

export interface DiagramData {
  type: string;
  title?: string;
  description?: string;
  data: Record<string, unknown>;
  style?: {
    colorScheme?: string;
    theme?: "light" | "dark";
  };
}

// ─── Color Palettes ─────────────────────────────────────────

const PALETTES: Record<string, string[]> = {
  warm: ["#C48C56", "#B07A48", "#8B6B3D", "#D4A574", "#E6C9A8", "#A0522D", "#CD853F", "#DEB887"],
  cool: ["#4A90D9", "#357ABD", "#5B9BD5", "#2E75B6", "#7CB5EC", "#4472C4", "#5B9BD5", "#91C7E8"],
  nature: ["#6B8E6B", "#4CAF50", "#81C784", "#A5D6A7", "#388E3C", "#2E7D32", "#66BB6A", "#43A047"],
  vibrant: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCE38A", "#EAFFD0"],
  earth: ["#8B7355", "#6B5B4D", "#9C8B75", "#C4B19A", "#A09080", "#7B6B5D", "#B0A090", "#D4C4B0"],
  default: ["#C48C56", "#4A90D9", "#6B8E6B", "#D4A574", "#7CB5EC", "#81C784", "#B07A48", "#5B9BD5"],
};

function getColors(scheme?: string): string[] {
  return PALETTES[scheme || "default"] || PALETTES.default;
}

// ─── Nivo Theme ─────────────────────────────────────────────

function getNivoTheme(mode?: "light" | "dark") {
  const isDark = mode === "dark";
  return {
    background: "transparent",
    text: { fontSize: 11, fill: isDark ? "#F2EFEA" : "#2C2824" },
    axis: {
      domain: { line: { stroke: isDark ? "#555" : "#ccc", strokeWidth: 1 } },
      ticks: {
        line: { stroke: isDark ? "#555" : "#ccc", strokeWidth: 1 },
        text: { fontSize: 10, fill: isDark ? "#aaa" : "#666" },
      },
      legend: { text: { fontSize: 12, fill: isDark ? "#ddd" : "#333", fontWeight: 600 } },
    },
    grid: { line: { stroke: isDark ? "#333" : "#eee", strokeWidth: 1 } },
    legends: { text: { fontSize: 11, fill: isDark ? "#ccc" : "#555" } },
    labels: { text: { fontSize: 11, fill: isDark ? "#F2EFEA" : "#2C2824" } },
    tooltip: {
      container: {
        background: isDark ? "#2C2824" : "#fff",
        color: isDark ? "#F2EFEA" : "#2C2824",
        fontSize: 12,
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      },
    },
  };
}

// ─── Bar Chart ──────────────────────────────────────────────

function BarChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const rawData = (data.items || data.data || []) as Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = rawData as any[];
  const keys = (data.keys || Object.keys(rawData[0] || {}).filter((k) => k !== (data.indexBy || "label"))) as string[];
  const indexBy = (data.indexBy || "label") as string;
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveBar
        data={chartData}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        colors={colors}
        borderRadius={4}
        theme={getNivoTheme(style?.theme)}
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: chartData.length > 6 ? -45 : 0 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        animate={true}
        motionConfig="gentle"
        enableGridY={true}
        groupMode={(data.groupMode as "grouped" | "stacked") || "grouped"}
        layout={(data.layout as "vertical" | "horizontal") || "vertical"}
      />
    </div>
  );
}

// ─── Line Chart ─────────────────────────────────────────────

function LineChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series = (data.series || data.data || []) as any[];
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        pointSize={8}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        enableArea={(data.enableArea as boolean) || false}
        curve={(data.curve as "linear" | "monotoneX" | "natural") || "monotoneX"}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Pie Chart ──────────────────────────────────────────────

function PieChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items || data.data || []) as any[];
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsivePie
        data={items}
        margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        innerRadius={(data.innerRadius as number) || 0.5}
        padAngle={0.7}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={style?.theme === "dark" ? "#ccc" : "#555"}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={10}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Radar Chart ────────────────────────────────────────────

function RadarChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = (data.items || data.data || []) as any[];
  const keys = (data.keys || []) as string[];
  const indexBy = (data.indexBy || "label") as string;
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveRadar
        data={chartData}
        keys={keys}
        indexBy={indexBy}
        maxValue="auto"
        margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        borderColor={{ from: "color" }}
        gridLabelOffset={20}
        dotSize={8}
        dotColor={{ theme: "background" }}
        dotBorderWidth={2}
        dotBorderColor={{ from: "color" }}
        fillOpacity={0.25}
        blendMode="multiply"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Funnel Chart ───────────────────────────────────────────

function FunnelChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items || data.data || []) as any[];
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveFunnel
        data={items}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        borderWidth={20}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        borderOpacity={0.5}
        labelColor={{ from: "color", modifiers: [["darker", 1.5]] }}
        animate={true}
        motionConfig="gentle"
        enableBeforeSeparators={true}
        enableAfterSeparators={true}
      />
    </div>
  );
}

// ─── Sankey Diagram ─────────────────────────────────────────

function SankeyDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sankeyData: any = {
    nodes: (data.nodes || []),
    links: (data.links || []),
  };
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 360 }}>
      <ResponsiveSankey
        data={sankeyData}
        margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        nodeOpacity={1}
        nodeThickness={18}
        nodeInnerPadding={3}
        nodeSpacing={24}
        nodeBorderWidth={0}
        linkOpacity={0.5}
        linkHoverOpacity={0.8}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Heatmap ────────────────────────────────────────────────

function HeatmapChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = (data.items || data.data || []) as any[];

  return (
    <div style={{ height: 320 }}>
      <ResponsiveHeatMap
        data={chartData}
        margin={{ top: 40, right: 20, bottom: 40, left: 80 }}
        theme={getNivoTheme(style?.theme)}
        colors={{ type: "sequential", scheme: "oranges" }}
        emptyColor="#555555"
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Treemap ────────────────────────────────────────────────

function TreemapChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treeData = (data.root || data.data || { name: "root", children: [] }) as any;
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveTreeMap
        data={treeData}
        identity="name"
        value="value"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        labelSkipSize={12}
        parentLabelPosition="left"
        parentLabelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Radial Bar ─────────────────────────────────────────────

function RadialBarChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items || data.data || []) as any[];
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveRadialBar
        data={items}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        padding={0.4}
        cornerRadius={4}
        enableRadialGrid={true}
        enableCircularGrid={true}
        radialAxisStart={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
        circularAxisOuter={{ tickSize: 5, tickPadding: 12, tickRotation: 0 }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Sunburst ───────────────────────────────────────────────

function SunburstChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treeData = (data.root || data.data || { name: "root", children: [] }) as any;
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveSunburst
        data={treeData}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        id="name"
        value="value"
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Network Diagram ────────────────────────────────────────

function NetworkDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const networkData: any = {
    nodes: (data.nodes || []) as { id: string; radius?: number; color?: string }[],
    links: (data.links || []) as { source: string; target: string; distance?: number }[],
  };
  const colors = getColors(style?.colorScheme);
  // Assign colors to nodes if not already assigned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkData.nodes = networkData.nodes.map((n: any, i: number) => ({
    ...n,
    radius: n.radius || 12,
    color: n.color || colors[i % colors.length],
  }));

  return (
    <div style={{ height: 360 }}>
      <ResponsiveNetwork
        data={networkData}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        theme={getNivoTheme(style?.theme)}
        repulsivity={100}
        iterations={60}
        nodeColor={colors[0]}
        nodeBorderWidth={1}
        nodeBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
        linkThickness={2}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Scatter Plot ───────────────────────────────────────────

function ScatterChart({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series = (data.series || data.data || []) as any[];
  const colors = getColors(style?.colorScheme);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveScatterPlot
        data={series}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        colors={colors}
        theme={getNivoTheme(style?.theme)}
        xScale={{ type: "linear", min: "auto", max: "auto" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        nodeSize={10}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ─── Custom SVG: Flowchart ──────────────────────────────────

function FlowchartDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const nodes = (data.nodes || []) as { id: string; label: string; type?: string }[];
  const edges = (data.edges || data.links || []) as { from: string; to: string; label?: string }[];
  const colors = getColors(style?.colorScheme);
  const direction = (data.direction || "vertical") as "vertical" | "horizontal";

  const nodeW = 160;
  const nodeH = 50;
  const gapX = direction === "horizontal" ? 220 : 200;
  const gapY = direction === "horizontal" ? 100 : 90;

  // Simple layout: place nodes in a grid
  const cols = direction === "horizontal" ? nodes.length : Math.min(3, nodes.length);
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    const col = direction === "horizontal" ? i : i % cols;
    const row = direction === "horizontal" ? 0 : Math.floor(i / cols);
    positions[n.id] = { x: 40 + col * gapX, y: 40 + row * gapY };
  });

  const maxX = Math.max(...Object.values(positions).map((p) => p.x)) + nodeW + 40;
  const maxY = Math.max(...Object.values(positions).map((p) => p.y)) + nodeH + 40;

  return (
    <svg viewBox={`0 0 ${maxX} ${maxY}`} className="w-full" style={{ maxHeight: 400 }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#8B7B6B" />
        </marker>
      </defs>
      {/* Edges */}
      {edges.map((e, i) => {
        const from = positions[e.from];
        const to = positions[e.to];
        if (!from || !to) return null;
        const x1 = from.x + nodeW / 2;
        const y1 = from.y + nodeH;
        const x2 = to.x + nodeW / 2;
        const y2 = to.y;
        return (
          <g key={`edge-${i}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B7B6B" strokeWidth="2" markerEnd="url(#arrowhead)" />
            {e.label && (
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="10" fill="#8B7B6B">
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => {
        const pos = positions[n.id];
        const color = colors[i % colors.length];
        const isDecision = n.type === "decision";
        const isStart = n.type === "start" || n.type === "end";
        return (
          <g key={n.id}>
            {isDecision ? (
              <polygon
                points={`${pos.x + nodeW / 2},${pos.y} ${pos.x + nodeW},${pos.y + nodeH / 2} ${pos.x + nodeW / 2},${pos.y + nodeH} ${pos.x},${pos.y + nodeH / 2}`}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth="2"
              />
            ) : (
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx={isStart ? 25 : 10}
                fill={color}
                fillOpacity={0.12}
                stroke={color}
                strokeWidth="2"
              />
            )}
            <text x={pos.x + nodeW / 2} y={pos.y + nodeH / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="#2C2824">
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Custom SVG: Mind Map ───────────────────────────────────

function MindMapDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const center = (data.center || data.root || "Topic") as string;
  const branches = (data.branches || data.children || []) as { label: string; children?: { label: string }[] }[];
  const colors = getColors(style?.colorScheme);

  const cx = 400;
  const cy = 250;
  const radius1 = 150;
  const radius2 = 260;

  return (
    <svg viewBox="0 0 800 500" className="w-full" style={{ maxHeight: 400 }}>
      {/* Center node */}
      <circle cx={cx} cy={cy} r={40} fill={colors[0]} fillOpacity={0.2} stroke={colors[0]} strokeWidth="2" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#2C2824">
        {center.length > 20 ? center.slice(0, 18) + "..." : center}
      </text>
      {/* Branches */}
      {branches.map((branch, i) => {
        const angle = (2 * Math.PI * i) / branches.length - Math.PI / 2;
        const bx = cx + radius1 * Math.cos(angle);
        const by = cy + radius1 * Math.sin(angle);
        const color = colors[(i + 1) % colors.length];

        return (
          <g key={`branch-${i}`}>
            <line x1={cx} y1={cy} x2={bx} y2={by} stroke={color} strokeWidth="2" opacity={0.6} />
            <circle cx={bx} cy={by} r={28} fill={color} fillOpacity={0.15} stroke={color} strokeWidth="1.5" />
            <text x={bx} y={by + 4} textAnchor="middle" fontSize="10" fontWeight="500" fill="#2C2824">
              {branch.label.length > 16 ? branch.label.slice(0, 14) + "..." : branch.label}
            </text>
            {/* Sub-branches */}
            {branch.children?.map((child, j) => {
              const subAngle = angle + ((j - (branch.children!.length - 1) / 2) * 0.4);
              const sx = cx + radius2 * Math.cos(subAngle);
              const sy = cy + radius2 * Math.sin(subAngle);
              return (
                <g key={`sub-${i}-${j}`}>
                  <line x1={bx} y1={by} x2={sx} y2={sy} stroke={color} strokeWidth="1" opacity={0.4} strokeDasharray="4 2" />
                  <circle cx={sx} cy={sy} r={20} fill={color} fillOpacity={0.08} stroke={color} strokeWidth="1" />
                  <text x={sx} y={sy + 3} textAnchor="middle" fontSize="9" fill="#2C2824">
                    {child.label.length > 14 ? child.label.slice(0, 12) + "..." : child.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Custom SVG: Timeline ───────────────────────────────────

function TimelineDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const events = (data.events || data.items || []) as { date?: string; title: string; description?: string }[];
  const colors = getColors(style?.colorScheme);
  const h = Math.max(120, events.length * 90 + 40);

  return (
    <svg viewBox={`0 0 600 ${h}`} className="w-full" style={{ maxHeight: 500 }}>
      {/* Vertical line */}
      <line x1="80" y1="20" x2="80" y2={h - 20} stroke="#C48C56" strokeWidth="2" opacity={0.3} />
      {events.map((event, i) => {
        const y = 40 + i * 90;
        const color = colors[i % colors.length];
        return (
          <g key={`event-${i}`}>
            <circle cx="80" cy={y} r="8" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="2" />
            <circle cx="80" cy={y} r="3" fill={color} />
            {event.date && (
              <text x="60" y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill={color}>
                {event.date}
              </text>
            )}
            <text x="100" y={y - 4} fontSize="12" fontWeight="600" fill="#2C2824">
              {event.title}
            </text>
            {event.description && (
              <text x="100" y={y + 14} fontSize="10" fill="#8B7B6B">
                {event.description.length > 60 ? event.description.slice(0, 58) + "..." : event.description}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Custom SVG: Process Diagram ────────────────────────────

function ProcessDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const steps = (data.steps || data.items || []) as { label: string; description?: string }[];
  const colors = getColors(style?.colorScheme);
  const stepW = 140;
  const stepH = 60;
  const gap = 40;
  const totalW = steps.length * (stepW + gap) - gap + 60;

  return (
    <svg viewBox={`0 0 ${Math.max(totalW, 300)} ${stepH + 80}`} className="w-full" style={{ maxHeight: 180 }}>
      {steps.map((step, i) => {
        const x = 30 + i * (stepW + gap);
        const y = 20;
        const color = colors[i % colors.length];
        return (
          <g key={`step-${i}`}>
            {/* Arrow between steps */}
            {i > 0 && (
              <g>
                <line x1={x - gap + 5} y1={y + stepH / 2} x2={x - 5} y2={y + stepH / 2} stroke="#8B7B6B" strokeWidth="2" markerEnd="url(#arrowhead-proc)" />
              </g>
            )}
            <rect x={x} y={y} width={stepW} height={stepH} rx={10} fill={color} fillOpacity={0.12} stroke={color} strokeWidth="1.5" />
            <text x={x + stepW / 2} y={y + 22} textAnchor="middle" fontSize="10" fontWeight="600" fill="#2C2824">
              Step {i + 1}
            </text>
            <text x={x + stepW / 2} y={y + 40} textAnchor="middle" fontSize="10" fill="#555">
              {step.label.length > 18 ? step.label.slice(0, 16) + "..." : step.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrowhead-proc" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#8B7B6B" />
        </marker>
      </defs>
    </svg>
  );
}

// ─── Custom SVG: Venn Diagram ───────────────────────────────

function VennDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const sets = (data.sets || data.items || []) as { label: string; description?: string }[];
  const intersection = (data.intersection || "") as string;
  const colors = getColors(style?.colorScheme);

  const cx1 = sets.length <= 2 ? 200 : 200;
  const cx2 = sets.length <= 2 ? 320 : 320;
  const cx3 = 260;
  const cy = 180;
  const r = 100;

  return (
    <svg viewBox="0 0 520 360" className="w-full" style={{ maxHeight: 360 }}>
      {sets[0] && (
        <g>
          <circle cx={cx1} cy={cy} r={r} fill={colors[0]} fillOpacity={0.2} stroke={colors[0]} strokeWidth="2" />
          <text x={cx1 - 40} y={cy} textAnchor="middle" fontSize="12" fontWeight="500" fill="#2C2824">{sets[0].label}</text>
        </g>
      )}
      {sets[1] && (
        <g>
          <circle cx={cx2} cy={cy} r={r} fill={colors[1]} fillOpacity={0.2} stroke={colors[1]} strokeWidth="2" />
          <text x={cx2 + 40} y={cy} textAnchor="middle" fontSize="12" fontWeight="500" fill="#2C2824">{sets[1].label}</text>
        </g>
      )}
      {sets[2] && (
        <g>
          <circle cx={cx3} cy={cy + 70} r={r} fill={colors[2]} fillOpacity={0.2} stroke={colors[2]} strokeWidth="2" />
          <text x={cx3} y={cy + 120} textAnchor="middle" fontSize="12" fontWeight="500" fill="#2C2824">{sets[2].label}</text>
        </g>
      )}
      {intersection && (
        <text x={260} y={cy + (sets.length > 2 ? 20 : 4)} textAnchor="middle" fontSize="11" fontWeight="600" fill="#C48C56">{intersection}</text>
      )}
    </svg>
  );
}

// ─── Custom SVG: Comparison ─────────────────────────────────

function ComparisonDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const items = (data.items || []) as { label: string; features: string[] }[];
  const colors = getColors(style?.colorScheme);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
      {items.map((item, i) => (
        <div
          key={`comp-${i}`}
          className="rounded-xl p-4 border"
          style={{ backgroundColor: `${colors[i % colors.length]}15`, borderColor: `${colors[i % colors.length]}40` }}
        >
          <h4 className="text-sm font-semibold mb-2" style={{ color: colors[i % colors.length] }}>{item.label}</h4>
          <ul className="space-y-1.5">
            {item.features.map((f, j) => (
              <li key={j} className="text-xs text-[#2C2824]/70 flex items-start gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Custom SVG: Org Chart ──────────────────────────────────

function OrgChartDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const root = (data.root || data.data || { label: "CEO", children: [] }) as {
    label: string;
    children?: { label: string; children?: { label: string }[] }[];
  };
  const colors = getColors(style?.colorScheme);

  const nodeW = 120;
  const nodeH = 36;

  // Flatten to levels
  type ONode = { label: string; level: number; index: number; parentIndex?: number; parentLevel?: number };
  const levels: ONode[][] = [];
  const queue: { node: typeof root; level: number; parentIndex?: number; parentLevel?: number }[] = [{ node: root, level: 0 }];
  while (queue.length) {
    const { node, level, parentIndex, parentLevel } = queue.shift()!;
    if (!levels[level]) levels[level] = [];
    const index = levels[level].length;
    levels[level].push({ label: node.label, level, index, parentIndex, parentLevel });
    node.children?.forEach((child) => queue.push({ node: child as typeof root, level: level + 1, parentIndex: index, parentLevel: level }));
  }

  const maxCols = Math.max(...levels.map((l) => l.length));
  const totalW = maxCols * (nodeW + 30) + 40;
  const totalH = levels.length * 80 + 20;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" style={{ maxHeight: 400 }}>
      <defs>
        <marker id="arrowhead-org" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#8B7B6B" />
        </marker>
      </defs>
      {levels.map((level, li) => {
        const levelW = level.length * (nodeW + 30) - 30;
        const offsetX = (totalW - levelW) / 2;
        return level.map((node, ni) => {
          const x = offsetX + ni * (nodeW + 30);
          const y = 20 + li * 80;
          const color = colors[li % colors.length];
          // Draw line to parent
          let parentLine = null;
          if (node.parentLevel !== undefined && node.parentIndex !== undefined) {
            const pLevel = levels[node.parentLevel];
            const pLevelW = pLevel.length * (nodeW + 30) - 30;
            const pOffsetX = (totalW - pLevelW) / 2;
            const px = pOffsetX + node.parentIndex * (nodeW + 30) + nodeW / 2;
            const py = 20 + node.parentLevel * 80 + nodeH;
            parentLine = <line x1={px} y1={py} x2={x + nodeW / 2} y2={y} stroke="#8B7B6B" strokeWidth="1.5" opacity={0.5} />;
          }
          return (
            <g key={`org-${li}-${ni}`}>
              {parentLine}
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={8} fill={color} fillOpacity={0.12} stroke={color} strokeWidth="1.5" />
              <text x={x + nodeW / 2} y={y + nodeH / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="500" fill="#2C2824">
                {node.label.length > 16 ? node.label.slice(0, 14) + "..." : node.label}
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
}

// ─── Custom: Pyramid ────────────────────────────────────────

function PyramidDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const levels = (data.levels || data.items || []) as { label: string; description?: string }[];
  const colors = getColors(style?.colorScheme);
  const h = levels.length * 50 + 20;

  return (
    <svg viewBox={`0 0 500 ${h}`} className="w-full" style={{ maxHeight: 400 }}>
      {levels.map((level, i) => {
        const y = 10 + i * 50;
        const topW = 100 + i * 70;
        const botW = 100 + (i + 1) * 70;
        const cx = 250;
        const color = colors[i % colors.length];
        return (
          <g key={`pyr-${i}`}>
            <polygon
              points={`${cx - topW / 2},${y} ${cx + topW / 2},${y} ${cx + botW / 2},${y + 45} ${cx - botW / 2},${y + 45}`}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth="1.5"
            />
            <text x={cx} y={y + 26} textAnchor="middle" fontSize="11" fontWeight="600" fill="#2C2824">
              {level.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Custom: Matrix ─────────────────────────────────────────

function MatrixDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const headers = (data.headers || []) as string[];
  const rows = (data.rows || []) as { label: string; values: (string | number)[] }[];
  const colors = getColors(style?.colorScheme);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold border-b-2" style={{ borderColor: colors[0], color: "#2C2824" }}></th>
            {headers.map((h, i) => (
              <th key={i} className="p-2 text-center font-semibold border-b-2" style={{ borderColor: colors[0], color: colors[i % colors.length] }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white/30" : ""}>
              <td className="p-2 font-medium" style={{ color: "#2C2824" }}>{row.label}</td>
              {row.values.map((v, vi) => (
                <td key={vi} className="p-2 text-center" style={{ color: "#555" }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Custom: Decision Tree ──────────────────────────────────

function DecisionTreeDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  // Reuse flowchart with decision-type nodes
  const flowData = { ...data };
  const nodes = (data.nodes || []) as { id: string; label: string; type?: string }[];
  // Mark nodes with "?" as decisions
  flowData.nodes = nodes.map((n) => ({
    ...n,
    type: n.type || (n.label.includes("?") ? "decision" : "default"),
  }));
  return <FlowchartDiagram data={flowData} style={style} />;
}

// ─── Custom: Checklist ──────────────────────────────────────

function ChecklistDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const items = (data.items || []) as { label: string; checked?: boolean }[];
  const colors = getColors(style?.colorScheme);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ backgroundColor: `${colors[i % colors.length]}10` }}>
          <div
            className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0"
            style={{ borderColor: colors[i % colors.length], backgroundColor: item.checked ? colors[i % colors.length] : "transparent" }}
          >
            {item.checked && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#2C2824]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom: Pros/Cons ──────────────────────────────────────

function ProsConsDiagram({ data, style }: { data: Record<string, unknown>; style?: DiagramData["style"] }) {
  const pros = (data.pros || []) as string[];
  const cons = (data.cons || []) as string[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _colors = getColors(style?.colorScheme);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl p-4 border" style={{ backgroundColor: "#6B8E6B15", borderColor: "#6B8E6B40" }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: "#6B8E6B" }}>Pros</h4>
        <ul className="space-y-1.5">
          {pros.map((p, i) => (
            <li key={i} className="text-xs text-[#2C2824]/70 flex items-start gap-1.5">
              <span className="mt-0.5 text-[#6B8E6B]">+</span> {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl p-4 border" style={{ backgroundColor: "#C4564015", borderColor: "#C4564040" }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: "#C45640" }}>Cons</h4>
        <ul className="space-y-1.5">
          {cons.map((c, i) => (
            <li key={i} className="text-xs text-[#2C2824]/70 flex items-start gap-1.5">
              <span className="mt-0.5 text-[#C45640]">-</span> {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Diagram Type Router ────────────────────────────────────

const DIAGRAM_COMPONENTS: Record<string, React.FC<{ data: Record<string, unknown>; style?: DiagramData["style"] }>> = {
  bar: BarChart,
  "bar-chart": BarChart,
  line: LineChart,
  "line-chart": LineChart,
  pie: PieChart,
  "pie-chart": PieChart,
  donut: PieChart,
  radar: RadarChart,
  "radar-chart": RadarChart,
  funnel: FunnelChart,
  "funnel-chart": FunnelChart,
  sankey: SankeyDiagram,
  "sankey-diagram": SankeyDiagram,
  heatmap: HeatmapChart,
  "heat-map": HeatmapChart,
  treemap: TreemapChart,
  "tree-map": TreemapChart,
  "radial-bar": RadialBarChart,
  "radial-bar-chart": RadialBarChart,
  sunburst: SunburstChart,
  "sunburst-chart": SunburstChart,
  network: NetworkDiagram,
  "network-diagram": NetworkDiagram,
  scatter: ScatterChart,
  "scatter-plot": ScatterChart,
  flowchart: FlowchartDiagram,
  "flow-chart": FlowchartDiagram,
  "process-diagram": ProcessDiagram,
  "decision-tree": DecisionTreeDiagram,
  mindmap: MindMapDiagram,
  "mind-map": MindMapDiagram,
  timeline: TimelineDiagram,
  process: ProcessDiagram,
  venn: VennDiagram,
  "venn-diagram": VennDiagram,
  comparison: ComparisonDiagram,
  "org-chart": OrgChartDiagram,
  orgchart: OrgChartDiagram,
  pyramid: PyramidDiagram,
  matrix: MatrixDiagram,
  table: MatrixDiagram,
  checklist: ChecklistDiagram,
  "pros-cons": ProsConsDiagram,
  "pros-and-cons": ProsConsDiagram,
};

// ─── Main Renderer ──────────────────────────────────────────

export default function DiagramRenderer({ diagram, onClose }: { diagram: DiagramData; onClose?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const DiagramComponent = DIAGRAM_COMPONENTS[diagram.type.toLowerCase()];

  if (!DiagramComponent) {
    return (
      <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-[#C48C56]/20">
        <p className="text-sm text-[#2C2824]/60">Unsupported diagram type: {diagram.type}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-[#C48C56]/15 overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 bg-white/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C48C56]/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 16l4-8 4 4 6-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            {diagram.title && (
              <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {diagram.title}
              </h3>
            )}
            <span className="text-[10px] uppercase tracking-wider text-[#8B7B6B] font-medium">{diagram.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg className={`w-3.5 h-3.5 text-[#8B7B6B] transition-transform ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              title="Close"
            >
              <svg className="w-3.5 h-3.5 text-[#8B7B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Description */}
      {diagram.description && !collapsed && (
        <div className="px-4 pt-2">
          <p className="text-xs text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{diagram.description}</p>
        </div>
      )}
      {/* Chart */}
      {!collapsed && (
        <div className="p-4">
          <DiagramComponent data={diagram.data} style={diagram.style} />
        </div>
      )}
    </div>
  );
}
