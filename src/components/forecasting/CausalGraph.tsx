"use client";

import React, { useRef, useEffect, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { EdgeCurveProgram } from "@sigma/edge-curve";
import forceLayout from "graphology-layout-force";
import louvain from "graphology-communities-louvain";
import { degreeCentrality } from "graphology-metrics/centrality/degree";

interface CausalNode {
  id: string;
  label: string;
  type?: "variable" | "target" | "exogenous" | "latent";
  metrics?: Record<string, number>;
}

interface CausalEdge {
  source: string;
  target: string;
  weight: number;
  type?: "positive" | "negative" | "bidirectional";
  lag?: number;
  label?: string;
}

interface CausalGraphData {
  nodes: CausalNode[];
  edges: CausalEdge[];
  title?: string;
}

interface CausalGraphProps {
  data: CausalGraphData;
  height?: number;
}

const NODE_COLORS: Record<string, string> = {
  variable: "#78c8b4",
  target: "#e8a87c",
  exogenous: "#8cc0de",
  latent: "#c9b1ff",
};

const COMMUNITY_COLORS = [
  "#78c8b4", "#e8a87c", "#d4a5a5", "#8cc0de", "#c9b1ff",
  "#f0c987", "#87ceeb", "#dda0dd", "#98fb98", "#ffa07a",
];

export default function CausalGraph({ data, height = 500 }: CausalGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [graphStats, setGraphStats] = useState<{
    nodes: number;
    edges: number;
    communities: number;
    density: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Clean up previous instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = new Graph({ type: "directed", multi: false });

    // Add nodes
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length;
      const radius = 3 + Math.random() * 2;

      graph.addNode(node.id, {
        label: node.label,
        x: radius * Math.cos(angle) + (Math.random() - 0.5) * 2,
        y: radius * Math.sin(angle) + (Math.random() - 0.5) * 2,
        size: 12,
        color: NODE_COLORS[node.type || "variable"] || "#78c8b4",
        nodeType: node.type || "variable",
        metrics: node.metrics || {},
        borderColor: "rgba(255,255,255,0.3)",
      });
    });

    // Add edges
    data.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        const edgeKey = `${edge.source}->${edge.target}`;
        if (!graph.hasEdge(edgeKey)) {
          const isNeg = edge.type === "negative";
          graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
            weight: Math.abs(edge.weight),
            size: Math.max(1, Math.abs(edge.weight) * 3),
            color: isNeg ? "rgba(232,168,124,0.5)" : "rgba(120,200,180,0.5)",
            type: "curvedArrow",
            label: edge.label || (edge.lag ? `lag=${edge.lag}` : ""),
            edgeType: edge.type || "positive",
            lag: edge.lag || 0,
            curvature: 0.2,
            forceLabel: true,
          });
        }
      }
    });

    // Apply force layout
    try {
      forceLayout.assign(graph, {
        maxIterations: 200,
        settings: {
          gravity: 0.05,
          repulsion: 1.5,
          attraction: 0.005,
          inertia: 0.6,
          maxMove: 10,
        },
      });
    } catch (e) {
      console.warn("Force layout error:", e);
    }

    // Detect communities
    let numCommunities = 0;
    try {
      const communities = louvain(graph);
      const communitySet = new Set(Object.values(communities));
      numCommunities = communitySet.size;

      // Color nodes by community
      graph.forEachNode((node) => {
        const community = communities[node] || 0;
        const nodeType = graph.getNodeAttribute(node, "nodeType");
        if (nodeType === "target") return; // Keep target color
        graph.setNodeAttribute(
          node,
          "color",
          COMMUNITY_COLORS[community % COMMUNITY_COLORS.length]
        );
      });
    } catch (e) {
      console.warn("Community detection error:", e);
    }

    // Compute centrality for node sizing
    try {
      const centralities = degreeCentrality(graph);
      const maxCentrality = Math.max(...Object.values(centralities), 0.01);

      graph.forEachNode((node) => {
        const c = centralities[node] || 0;
        graph.setNodeAttribute(node, "size", 8 + (c / maxCentrality) * 18);
      });
    } catch (e) {
      console.warn("Centrality error:", e);
    }

    // Compute stats
    const density =
      graph.order > 1
        ? graph.size / (graph.order * (graph.order - 1))
        : 0;

    setGraphStats({
      nodes: graph.order,
      edges: graph.size,
      communities: numCommunities || 1,
      density: Math.round(density * 1000) / 1000,
    });

    // Create Sigma instance
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: true,
      edgeProgramClasses: {
        curvedArrow: EdgeCurveProgram,
      },
      defaultEdgeType: "curvedArrow",
      labelFont: "'Cormorant Garamond', serif",
      labelSize: 13,
      labelWeight: "400",
      labelColor: { color: "rgba(255,255,255,0.85)" },
      edgeLabelFont: "'Cormorant Garamond', serif",
      edgeLabelSize: 10,
      edgeLabelColor: { color: "rgba(255,255,255,0.5)" },
      defaultNodeColor: "#78c8b4",
      defaultEdgeColor: "rgba(255,255,255,0.15)",
      stagePadding: 40,
      labelRenderedSizeThreshold: 6,
      enableEdgeEvents: true,
    });

    sigmaRef.current = sigma;

    // Draggable nodes
    let draggedNode: string | null = null;
    let isDragging = false;

    sigma.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      sigma.getCamera().disable();
    });

    sigma.getMouseCaptor().on("mousemovebody", (e) => {
      if (!isDragging || !draggedNode) return;
      const pos = sigma.viewportToGraph(e);
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);
    });

    sigma.getMouseCaptor().on("mouseup", () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }
      isDragging = false;
      draggedNode = null;
      sigma.getCamera().enable();
    });

    // Hover effects
    sigma.on("enterNode", (e) => {
      setHoveredNode(e.node);
      graph.forEachNode((n) => {
        if (n === e.node) {
          graph.setNodeAttribute(n, "highlighted", true);
        }
      });
      // Highlight connected edges
      graph.forEachEdge(e.node, (edge) => {
        graph.setEdgeAttribute(edge, "color", graph.getEdgeAttribute(edge, "edgeType") === "negative"
          ? "rgba(232,168,124,0.9)"
          : "rgba(120,200,180,0.9)");
        graph.setEdgeAttribute(edge, "size", (graph.getEdgeAttribute(edge, "size") || 2) * 1.5);
      });
      sigma.refresh();
    });

    sigma.on("leaveNode", (e) => {
      setHoveredNode(null);
      graph.forEachNode((n) => {
        graph.removeNodeAttribute(n, "highlighted");
      });
      graph.forEachEdge(e.node, (edge) => {
        const isNeg = graph.getEdgeAttribute(edge, "edgeType") === "negative";
        graph.setEdgeAttribute(edge, "color", isNeg ? "rgba(232,168,124,0.5)" : "rgba(120,200,180,0.5)");
        graph.setEdgeAttribute(edge, "size", Math.max(1, (graph.getEdgeAttribute(edge, "weight") || 1) * 3));
      });
      sigma.refresh();
    });

    // Click for selection
    sigma.on("clickNode", (e) => {
      setSelectedNode((prev) => (prev === e.node ? null : e.node));
    });

    sigma.on("clickStage", () => {
      setSelectedNode(null);
    });

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [data]);

  const getNodeInfo = () => {
    if (!selectedNode) return null;
    const node = data.nodes.find((n) => n.id === selectedNode);
    if (!node) return null;

    const inEdges = data.edges.filter((e) => e.target === selectedNode);
    const outEdges = data.edges.filter((e) => e.source === selectedNode);

    return { node, inEdges, outEdges };
  };

  const nodeInfo = getNodeInfo();

  return (
    <div className="space-y-3">
      {data.title && (
        <h5
          className="text-xs tracking-[0.12em] uppercase text-white/40"
          style={{ fontFamily: "'Syncopate', sans-serif" }}
        >
          {data.title}
        </h5>
      )}

      <div
        className="relative rounded-xl border border-white/[0.12] overflow-hidden"
        style={{ height, background: "#0a0c0a" }}
      >
        <div ref={containerRef} className="w-full h-full" />

        {/* Graph stats overlay */}
        {graphStats && (
          <div className="absolute top-3 left-3 flex gap-3">
            {[
              { label: "Nodes", value: graphStats.nodes },
              { label: "Edges", value: graphStats.edges },
              { label: "Communities", value: graphStats.communities },
              { label: "Density", value: graphStats.density },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0d0f0d]/90 border border-white/[0.08] rounded-lg px-2.5 py-1.5"
              >
                <div
                  className="text-white/70 text-sm font-medium"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-[9px] text-white/30 tracking-wider uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hovered node tooltip */}
        {hoveredNode && (
          <div className="absolute top-3 right-3 bg-[#0d0f0d]/95 border border-white/[0.12] rounded-lg px-3 py-2 max-w-[200px]">
            <div
              className="text-white/80 text-sm font-medium"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {hoveredNode}
            </div>
            <div className="text-[10px] text-white/40 mt-1">
              Drag to reposition
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-[#0d0f0d]/90 border border-white/[0.08] rounded-lg px-3 py-2">
          <div className="text-[9px] text-white/30 tracking-wider uppercase mb-1.5">Edge Types</div>
          <div className="flex gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#78c8b4]" />
              <span className="text-white/50">Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#e8a87c]" />
              <span className="text-white/50">Negative</span>
            </div>
          </div>
          <div className="text-[9px] text-white/30 tracking-wider uppercase mt-2 mb-1.5">Node Types</div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-white/50 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected node details */}
      {nodeInfo && (
        <div className="rounded-xl border border-white/[0.12] bg-[#0d0f0d]/90 p-4 shadow-lg">
          <h6
            className="text-xs tracking-[0.12em] uppercase text-[#78c8b4] mb-2"
            style={{ fontFamily: "'Syncopate', sans-serif" }}
          >
            {nodeInfo.node.label}
          </h6>
          <div className="text-xs text-white/40 mb-3 capitalize">
            Type: {nodeInfo.node.type || "variable"}
          </div>

          {nodeInfo.node.metrics && Object.keys(nodeInfo.node.metrics).length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Object.entries(nodeInfo.node.metrics).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-sm text-white/70" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {typeof val === "number" ? val.toFixed(2) : val}
                  </div>
                  <div className="text-[9px] text-white/30 uppercase">{key}</div>
                </div>
              ))}
            </div>
          )}

          {nodeInfo.inEdges.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-white/30 uppercase mb-1">Causes (incoming)</div>
              {nodeInfo.inEdges.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/50 py-0.5">
                  <span className={e.type === "negative" ? "text-[#e8a87c]" : "text-[#78c8b4]"}>
                    {e.type === "negative" ? "-" : "+"}
                  </span>
                  <span>{e.source}</span>
                  <span className="text-white/20">w={e.weight.toFixed(2)}</span>
                  {e.lag ? <span className="text-white/20">lag={e.lag}</span> : null}
                </div>
              ))}
            </div>
          )}

          {nodeInfo.outEdges.length > 0 && (
            <div>
              <div className="text-[10px] text-white/30 uppercase mb-1">Effects (outgoing)</div>
              {nodeInfo.outEdges.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/50 py-0.5">
                  <span className={e.type === "negative" ? "text-[#e8a87c]" : "text-[#78c8b4]"}>
                    {e.type === "negative" ? "-" : "+"}
                  </span>
                  <span>{e.target}</span>
                  <span className="text-white/20">w={e.weight.toFixed(2)}</span>
                  {e.lag ? <span className="text-white/20">lag={e.lag}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
