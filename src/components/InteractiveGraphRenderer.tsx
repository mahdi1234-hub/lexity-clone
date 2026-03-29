"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface InteractiveGraphData {
  nodes: Array<{
    id: string;
    label?: string;
    group?: string;
    category?: string;
    size?: number;
    color?: string;
    description?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
    weight?: number;
    color?: string;
    style?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  directed?: boolean;
  layout?: "force" | "radial" | "hierarchical" | "circular";
  title?: string;
  description?: string;
  // Network analytics (KeyLines/ReGraph features)
  analytics?: {
    showCentrality?: boolean;
    showCommunities?: boolean;
    showShortestPath?: boolean;
    pathFrom?: string;
    pathTo?: string;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  person: "#E57373", concept: "#64B5F6", topic: "#81C784", event: "#FFB74D",
  technology: "#BA68C8", place: "#4DB6AC", organization: "#FF8A65",
  emotion: "#F06292", action: "#AED581", object: "#90A4AE",
  default: "#C48C56", group0: "#E57373", group1: "#64B5F6", group2: "#81C784",
  group3: "#FFB74D", group4: "#BA68C8", group5: "#4DB6AC", group6: "#FF8A65",
  group7: "#F06292", group8: "#AED581", group9: "#90A4AE",
};

function getNodeColor(node: InteractiveGraphData["nodes"][0]): string {
  if (node.color) return node.color;
  const cat = node.category || node.group || "default";
  return CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS[`group${parseInt(cat) % 10}`] || CATEGORY_COLORS.default;
}

// Simple community detection (connected components + modularity heuristic)
function detectCommunities(nodes: InteractiveGraphData["nodes"], edges: InteractiveGraphData["edges"]): Map<string, number> {
  const adj = new Map<string, Set<string>>();
  nodes.forEach(n => adj.set(n.id, new Set()));
  edges.forEach(e => {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  });

  const community = new Map<string, number>();
  let communityId = 0;
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      community.set(current, communityId);
      adj.get(current)?.forEach(neighbor => {
        if (!visited.has(neighbor)) queue.push(neighbor);
      });
    }
    communityId++;
  }
  return community;
}

// Degree centrality
function computeCentrality(nodes: InteractiveGraphData["nodes"], edges: InteractiveGraphData["edges"]): Map<string, number> {
  const degree = new Map<string, number>();
  nodes.forEach(n => degree.set(n.id, 0));
  edges.forEach(e => {
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
  });
  const maxDeg = Math.max(...Array.from(degree.values()), 1);
  const centrality = new Map<string, number>();
  degree.forEach((v, k) => centrality.set(k, v / maxDeg));
  return centrality;
}

// BFS shortest path
function shortestPath(edges: InteractiveGraphData["edges"], from: string, to: string): string[] | null {
  const adj = new Map<string, string[]>();
  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  });

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue = [from];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) {
      const path = [to];
      let c = to;
      while (parent.has(c)) { c = parent.get(c)!; path.unshift(c); }
      return path;
    }
    for (const neighbor of adj.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  return null;
}

export default function InteractiveGraphRenderer({ config }: { config: InteractiveGraphData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [highlightPath, setHighlightPath] = useState<string[] | null>(null);

  const width = 640;
  const height = 450;

  useEffect(() => {
    if (!svgRef.current || !config.nodes || config.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: any[] = config.nodes.map(n => ({ ...n }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links: any[] = config.edges.map(e => ({ ...e }));

    // Compute analytics
    const communities = config.analytics?.showCommunities ? detectCommunities(config.nodes, config.edges) : null;
    const centrality = config.analytics?.showCentrality ? computeCentrality(config.nodes, config.edges) : null;

    if (config.analytics?.showShortestPath && config.analytics.pathFrom && config.analytics.pathTo) {
      const path = shortestPath(config.edges, config.analytics.pathFrom, config.analytics.pathTo);
      setHighlightPath(path);
    }

    // Color scale for communities
    const communityColor = d3.scaleOrdinal(d3.schemeTableau10);

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(config.layout === "radial" ? 100 : 80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(25));

    if (config.layout === "radial") {
      simulation.force("r", d3.forceRadial(150, width / 2, height / 2));
    }

    // Arrow markers for directed graphs
    if (config.directed) {
      svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");
    }

    // Draw edges
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: any) => {
        if (highlightPath && highlightPath.includes(d.source.id || d.source) && highlightPath.includes(d.target.id || d.target)) return "#FF6B6B";
        return d.color || "#999";
      })
      .attr("stroke-opacity", (d: any) => d.weight ? Math.min(0.3 + d.weight * 0.1, 1) : 0.5)
      .attr("stroke-width", (d: any) => d.weight ? Math.max(1, Math.min(d.weight, 5)) : 1.5)
      .attr("stroke-dasharray", (d: any) => d.style === "dashed" ? "5,5" : null)
      .attr("marker-end", config.directed ? "url(#arrowhead)" : null);

    // Edge labels
    const edgeLabel = g.append("g")
      .selectAll("text")
      .data(links.filter((l: any) => l.label))
      .enter().append("text")
      .attr("font-size", 9)
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .text((d: any) => d.label);

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    // Node circles
    node.append("circle")
      .attr("r", (d: any) => {
        const base = d.size || 8;
        if (centrality) return base + centrality.get(d.id)! * 12;
        return base;
      })
      .attr("fill", (d: any) => {
        if (communities) return communityColor(String(communities.get(d.id)));
        return getNodeColor(d);
      })
      .attr("stroke", (d: any) => {
        if (highlightPath?.includes(d.id)) return "#FF6B6B";
        if (selectedNode === d.id) return "#C48C56";
        return "#fff";
      })
      .attr("stroke-width", (d: any) => {
        if (highlightPath?.includes(d.id) || selectedNode === d.id) return 3;
        return 1.5;
      })
      .style("cursor", "grab")
      .on("mouseover", function (event: any, d: any) {
        d3.select(this).transition().duration(150).attr("r", (d.size || 8) + 4);
        const desc = d.description || d.label || d.id;
        const centralityStr = centrality ? ` | Centrality: ${(centrality.get(d.id)! * 100).toFixed(0)}%` : "";
        const communityStr = communities ? ` | Community: ${communities.get(d.id)}` : "";
        setTooltip({ x: event.offsetX, y: event.offsetY, content: `${desc}${centralityStr}${communityStr}` });
      })
      .on("mouseout", function (_event: any, d: any) {
        d3.select(this).transition().duration(150).attr("r", centrality ? (d.size || 8) + centrality.get(d.id)! * 12 : d.size || 8);
        setTooltip(null);
      })
      .on("click", (_event: any, d: any) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
      });

    // Node labels
    node.append("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("font-size", 11)
      .attr("fill", "#2C2824")
      .attr("font-family", "'Plus Jakarta Sans', sans-serif")
      .text((d: any) => d.label || d.id);

    // Tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      edgeLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [config, selectedNode, highlightPath]);

  const categories = Array.from(new Set(config.nodes.map(n => n.category || n.group || "default")));

  return (
    <div className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-[#C48C56]/15 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 bg-white/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#BA68C8]/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#BA68C8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
              <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
            </svg>
          </div>
          <div>
            {config.title && <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{config.title}</h3>}
            <span className="text-[10px] uppercase tracking-wider text-[#8B7B6B] font-medium">
              Interactive Graph | {config.nodes.length} nodes, {config.edges.length} edges
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`px-2.5 py-1 text-[10px] rounded-lg transition-colors ${showAnalytics ? "bg-[#BA68C8]/20 text-[#BA68C8]" : "text-[#8B7B6B] hover:bg-black/5"}`}
        >
          Analytics
        </button>
      </div>

      {/* Legend */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-black/5 bg-white/20">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.default }} />
              <span className="text-[10px] text-[#8B7B6B]">{cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="px-4 py-2 border-b border-black/5 bg-[#BA68C8]/5 text-xs space-y-1">
          <p className="font-medium text-[#BA68C8]">Network Analytics</p>
          <p className="text-[#2C2824]/60">Nodes: {config.nodes.length} | Edges: {config.edges.length} | Density: {(2 * config.edges.length / (config.nodes.length * (config.nodes.length - 1)) * 100).toFixed(1)}%</p>
          <p className="text-[#2C2824]/60">Avg Degree: {(2 * config.edges.length / config.nodes.length).toFixed(1)}</p>
        </div>
      )}

      {/* Graph SVG */}
      <div className="relative" style={{ height }}>
        <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full" />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-[#2C2824] text-white text-[10px] px-2 py-1 rounded-lg shadow-lg max-w-[200px]"
            style={{ left: tooltip.x + 10, top: tooltip.y - 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
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
