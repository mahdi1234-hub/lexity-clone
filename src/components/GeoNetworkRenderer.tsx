/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface GeoNetworkData {
  title?: string;
  description?: string;
  nodes: Array<{
    id: string;
    label?: string;
    lat: number;
    lon: number;
    category?: string;
    size?: number;
    color?: string;
    description?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
    weight?: number;
    color?: string;
    type?: string;
  }>;
  projection?: "mercator" | "equirectangular" | "orthographic" | "naturalEarth";
  showGraticule?: boolean;
  showLabels?: boolean;
  showLand?: boolean;
}

const CATEGORY_COLORS = [
  "#E57373", "#64B5F6", "#81C784", "#FFB74D", "#BA68C8",
  "#4DB6AC", "#FF8A65", "#F06292", "#AED581", "#90A4AE",
];

export default function GeoNetworkRenderer({ config }: { config: GeoNetworkData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const width = 640;
  const height = 400;

  useEffect(() => {
    if (!svgRef.current || !config.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Projection
    const projectionType = config.projection || "naturalEarth";
    let projection: d3.GeoProjection;
    switch (projectionType) {
      case "mercator": projection = d3.geoMercator(); break;
      case "equirectangular": projection = d3.geoEquirectangular(); break;
      case "orthographic": projection = d3.geoOrthographic(); break;
      default: projection = d3.geoNaturalEarth1(); break;
    }

    // Auto-fit to nodes
    const lons = config.nodes.map(n => n.lon);
    const lats = config.nodes.map(n => n.lat);
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

    projection
      .center([centerLon, centerLat])
      .translate([width / 2, height / 2]);

    // Compute scale to fit all points
    const testProjected = config.nodes.map(n => projection([n.lon, n.lat])).filter(Boolean) as [number, number][];
    if (testProjected.length > 1) {
      const xExtent = d3.extent(testProjected, d => d[0]) as [number, number];
      const yExtent = d3.extent(testProjected, d => d[1]) as [number, number];
      const dx = xExtent[1] - xExtent[0];
      const dy = yExtent[1] - yExtent[0];
      const scale = Math.min((width - 80) / (dx || 1), (height - 80) / (dy || 1)) * projection.scale();
      projection.scale(Math.min(scale, 2000));
    } else {
      projection.scale(400);
    }

    const path = d3.geoPath().projection(projection);

    // Graticule
    if (config.showGraticule !== false) {
      const graticule = d3.geoGraticule();
      g.append("path")
        .datum(graticule())
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#eee")
        .attr("stroke-width", 0.5);
    }

    // Outline
    g.append("path")
      .datum({ type: "Sphere" } as any)
      .attr("d", path as any)
      .attr("fill", "#f8f8f8")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    // Categories
    const categories = Array.from(new Set(config.nodes.map(n => n.category || "default")));
    const colorScale = d3.scaleOrdinal<string>().domain(categories).range(CATEGORY_COLORS);

    // Draw edges (great circle arcs)
    config.edges.forEach(edge => {
      const sourceNode = config.nodes.find(n => n.id === edge.source);
      const targetNode = config.nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const sourcePos = projection([sourceNode.lon, sourceNode.lat]);
      const targetPos = projection([targetNode.lon, targetNode.lat]);
      if (!sourcePos || !targetPos) return;

      const isSelected = selectedNode === edge.source || selectedNode === edge.target;

      // Curved arc
      const dx = targetPos[0] - sourcePos[0];
      const dy = targetPos[1] - sourcePos[1];
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

      g.append("path")
        .attr("d", `M${sourcePos[0]},${sourcePos[1]}A${dr},${dr} 0 0,1 ${targetPos[0]},${targetPos[1]}`)
        .attr("fill", "none")
        .attr("stroke", edge.color || (isSelected ? "#C48C56" : "#999"))
        .attr("stroke-width", isSelected ? 2 : edge.weight || 1)
        .attr("stroke-opacity", isSelected ? 0.8 : 0.4)
        .attr("stroke-dasharray", edge.type === "dashed" ? "4,4" : null);
    });

    // Draw nodes
    config.nodes.forEach(node => {
      const pos = projection([node.lon, node.lat]);
      if (!pos) return;

      const isSelected = selectedNode === node.id;
      const r = node.size || 6;

      // Node circle
      g.append("circle")
        .attr("cx", pos[0])
        .attr("cy", pos[1])
        .attr("r", isSelected ? r + 3 : r)
        .attr("fill", node.color || colorScale(node.category || "default"))
        .attr("stroke", isSelected ? "#C48C56" : "#fff")
        .attr("stroke-width", isSelected ? 2.5 : 1.5)
        .attr("fill-opacity", 0.9)
        .style("cursor", "pointer")
        .on("mouseover", (event: any) => {
          setTooltip({
            x: event.offsetX,
            y: event.offsetY,
            content: `${node.label || node.id}${node.description ? ` - ${node.description}` : ""} (${node.lat.toFixed(2)}, ${node.lon.toFixed(2)})`,
          });
        })
        .on("mouseout", () => setTooltip(null))
        .on("click", () => setSelectedNode(selectedNode === node.id ? null : node.id));

      // Label
      if (config.showLabels !== false) {
        g.append("text")
          .attr("x", pos[0] + r + 4)
          .attr("y", pos[1] + 4)
          .attr("font-size", 10)
          .attr("fill", "#2C2824")
          .attr("font-family", "'Plus Jakarta Sans', sans-serif")
          .text(node.label || node.id);
      }
    });

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

  }, [config, selectedNode]);

  return (
    <div className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-[#4DB6AC]/15 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 bg-white/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#4DB6AC]/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#4DB6AC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            {config.title && <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{config.title}</h3>}
            <span className="text-[10px] uppercase tracking-wider text-[#8B7B6B] font-medium">
              Geo Network | {config.nodes.length} locations, {config.edges.length} connections
            </span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full" />
        {tooltip && (
          <div className="absolute pointer-events-none bg-[#2C2824] text-white text-[10px] px-2 py-1 rounded-lg shadow-lg max-w-[250px]" style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}>
            {tooltip.content}
          </div>
        )}
      </div>

      {config.description && (
        <div className="px-4 py-2 border-t border-black/5">
          <p className="text-xs text-[#8B7B6B]">{config.description}</p>
        </div>
      )}
    </div>
  );
}
