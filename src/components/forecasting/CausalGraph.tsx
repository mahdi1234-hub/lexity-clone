"use client";

import React, { useRef, useEffect, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceLayout from "graphology-layout-force";
import louvain from "graphology-communities-louvain";

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
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [graphMetrics, setGraphMetrics] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Clean up previous instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = new Graph({ type: "directed", multi: false });
    graphRef.current = graph;

    // Add nodes in circular layout (static)
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length;
      const radius = 4;

      graph.addNode(node.id, {
        label: node.label,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        size: 14,
        color: NODE_COLORS[node.type || "variable"] || "#78c8b4",
        nodeType: node.type || "variable",
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
            size: Math.max(1.5, Math.abs(edge.weight) * 4),
            color: isNeg ? "rgba(232,168,124,0.6)" : "rgba(120,200,180,0.6)",
            type: "arrow",
            label: edge.label || "",
            edgeType: edge.type || "positive",
            forceLabel: true,
          });
        }
      }
    });

    // Apply force layout ONCE to get positions, then stop
    try {
      forceLayout.assign(graph, {
        maxIterations: 300,
        settings: {
          gravity: 0.08,
          repulsion: 2.0,
          attraction: 0.003,
          inertia: 0.5,
          maxMove: 15,
        },
      });
    } catch (e) {
      // Keep circular layout if force fails
    }

    // Detect communities
    let communities: Record<string, number> = {};
    let numCommunities = 0;
    try {
      communities = louvain(graph);
      const communitySet = new Set(Object.values(communities));
      numCommunities = communitySet.size;

      graph.forEachNode((node: string) => {
        const nodeType = graph.getNodeAttribute(node, "nodeType");
        if (nodeType === "target") return;
        const community = communities[node] || 0;
        graph.setNodeAttribute(node, "color", COMMUNITY_COLORS[community % COMMUNITY_COLORS.length]);
      });
    } catch (e) {
      // Skip community detection
    }

    // Compute metrics
    const nodeMetrics: Record<string, { inDegree: number; outDegree: number; degree: number; betweenness: number }> = {};
    let maxDegree = 1;

    graph.forEachNode((node: string) => {
      const inDeg = graph.inDegree(node);
      const outDeg = graph.outDegree(node);
      const deg = inDeg + outDeg;
      nodeMetrics[node] = { inDegree: inDeg, outDegree: outDeg, degree: deg, betweenness: 0 };
      if (deg > maxDegree) maxDegree = deg;
    });

    // Size nodes by degree
    graph.forEachNode((node: string) => {
      const deg = nodeMetrics[node]?.degree || 0;
      graph.setNodeAttribute(node, "size", 10 + (deg / maxDegree) * 16);
    });

    // Simple betweenness approximation
    const allNodes = graph.nodes();
    allNodes.forEach((source: string) => {
      allNodes.forEach((target: string) => {
        if (source === target) return;
        // Check if there's a path through any intermediate node
        allNodes.forEach((mid: string) => {
          if (mid === source || mid === target) return;
          if (graph.hasEdge(source, mid) && graph.hasEdge(mid, target)) {
            if (nodeMetrics[mid]) nodeMetrics[mid].betweenness += 1;
          }
        });
      });
    });

    // Compute overall graph metrics
    const totalNodes = graph.order;
    const totalEdges = graph.size;
    const density = totalNodes > 1 ? totalEdges / (totalNodes * (totalNodes - 1)) : 0;

    // Find hub nodes (highest degree)
    const sortedByDegree = Object.entries(nodeMetrics).sort((a, b) => b[1].degree - a[1].degree);
    const hubNode = sortedByDegree[0]?.[0] || "";
    const bridgeNode = Object.entries(nodeMetrics).sort((a, b) => b[1].betweenness - a[1].betweenness)[0]?.[0] || "";

    // Count positive/negative edges
    let posEdges = 0;
    let negEdges = 0;
    graph.forEachEdge((_edge: string, attrs: any) => {
      if (attrs.edgeType === "negative") negEdges++;
      else posEdges++;
    });

    // Average clustering coefficient approximation
    let totalClustering = 0;
    graph.forEachNode((node: string) => {
      const neighbors = graph.neighbors(node);
      if (neighbors.length < 2) return;
      let connections = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (graph.hasEdge(neighbors[i], neighbors[j]) || graph.hasEdge(neighbors[j], neighbors[i])) {
            connections++;
          }
        }
      }
      const possible = (neighbors.length * (neighbors.length - 1)) / 2;
      totalClustering += possible > 0 ? connections / possible : 0;
    });
    const avgClustering = totalNodes > 0 ? totalClustering / totalNodes : 0;

    setGraphMetrics({
      totalNodes,
      totalEdges,
      density: Math.round(density * 1000) / 1000,
      communities: numCommunities || 1,
      posEdges,
      negEdges,
      hubNode,
      bridgeNode,
      avgClustering: Math.round(avgClustering * 1000) / 1000,
      nodeMetrics,
    });

    // Create Sigma with static layout (no animation)
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: true,
      defaultEdgeType: "arrow",
      labelFont: "'Cormorant Garamond', serif",
      labelSize: 12,
      labelWeight: "400",
      labelColor: { color: "rgba(255,255,255,0.85)" },
      edgeLabelFont: "'Cormorant Garamond', serif",
      edgeLabelSize: 9,
      edgeLabelColor: { color: "rgba(255,255,255,0.4)" },
      defaultNodeColor: "#78c8b4",
      defaultEdgeColor: "rgba(255,255,255,0.15)",
      stagePadding: 50,
      labelRenderedSizeThreshold: 4,
      enableEdgeEvents: true,
    });

    sigmaRef.current = sigma;

    // DRAGGABLE NODES - only moves when user drags
    let draggedNode: string | null = null;
    let isDragging = false;

    sigma.on("downNode", (e: any) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      sigma.getCamera().disable();
    });

    sigma.getMouseCaptor().on("mousemovebody", (e: any) => {
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
    sigma.on("enterNode", (e: any) => {
      document.body.style.cursor = "grab";
      graph.forEachEdge(e.node, (edge: string) => {
        const isNeg = graph.getEdgeAttribute(edge, "edgeType") === "negative";
        graph.setEdgeAttribute(edge, "color", isNeg ? "rgba(232,168,124,1)" : "rgba(120,200,180,1)");
        graph.setEdgeAttribute(edge, "size", (graph.getEdgeAttribute(edge, "weight") || 1) * 6);
      });
      sigma.refresh();
    });

    sigma.on("leaveNode", (e: any) => {
      document.body.style.cursor = "default";
      graph.forEachEdge(e.node, (edge: string) => {
        const isNeg = graph.getEdgeAttribute(edge, "edgeType") === "negative";
        graph.setEdgeAttribute(edge, "color", isNeg ? "rgba(232,168,124,0.6)" : "rgba(120,200,180,0.6)");
        graph.setEdgeAttribute(edge, "size", Math.max(1.5, (graph.getEdgeAttribute(edge, "weight") || 1) * 4));
      });
      sigma.refresh();
    });

    sigma.on("clickNode", (e: any) => {
      setSelectedNode((prev: string | null) => (prev === e.node ? null : e.node));
    });

    sigma.on("clickStage", () => {
      setSelectedNode(null);
    });

    return () => {
      document.body.style.cursor = "default";
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
    const metrics = graphMetrics?.nodeMetrics?.[selectedNode];
    return { node, inEdges, outEdges, metrics };
  };

  const nodeInfo = getNodeInfo();

  return (
    <div className="space-y-3">
      {data.title && (
        <h5 className="text-xs tracking-[0.12em] uppercase text-white/40" style={{ fontFamily: "'Syncopate', sans-serif" }}>
          {data.title}
        </h5>
      )}

      {/* Graph container */}
      <div className="relative rounded-xl border border-white/[0.12] overflow-hidden" style={{ height, background: "#0a0c0a" }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-[#0d0f0d]/95 border border-white/[0.08] rounded-lg px-3 py-2">
          <div className="flex gap-3 text-[10px] mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#78c8b4]" />
              <span className="text-white/50">Positive cause</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#e8a87c]" />
              <span className="text-white/50">Negative cause</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px]">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-white/40 capitalize">{type}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-white/25 mt-1">Drag nodes to reposition. Click to inspect.</div>
        </div>
      </div>

      {/* Graph KPIs */}
      {graphMetrics && (
        <div className="rounded-xl border border-white/[0.12] bg-[#0d0f0d]/90 p-4 shadow-lg">
          <h5 className="text-xs tracking-[0.12em] uppercase text-white/40 mb-3" style={{ fontFamily: "'Syncopate', sans-serif" }}>
            Network Metrics
          </h5>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: "Nodes", value: graphMetrics.totalNodes },
              { label: "Edges", value: graphMetrics.totalEdges },
              { label: "Density", value: graphMetrics.density },
              { label: "Communities", value: graphMetrics.communities },
              { label: "Avg Clustering", value: graphMetrics.avgClustering },
              { label: "Positive Edges", value: graphMetrics.posEdges },
              { label: "Negative Edges", value: graphMetrics.negEdges },
              { label: "Hub Node", value: graphMetrics.hubNode },
              { label: "Bridge Node", value: graphMetrics.bridgeNode },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-1.5">
                <div className="text-sm text-white/80 font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {kpi.value}
                </div>
                <div className="text-[9px] text-white/30 tracking-wider uppercase">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected node detail panel */}
      {nodeInfo && (
        <div className="rounded-xl border border-white/[0.12] bg-[#0d0f0d]/90 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[nodeInfo.node.type || "variable"] }} />
            <h6 className="text-sm text-white/80 font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {nodeInfo.node.label}
            </h6>
            <span className="text-[10px] text-white/30 capitalize px-2 py-0.5 bg-white/5 rounded">{nodeInfo.node.type}</span>
          </div>

          {nodeInfo.metrics && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center">
                <div className="text-sm text-white/70">{nodeInfo.metrics.inDegree}</div>
                <div className="text-[9px] text-white/25 uppercase">In-Degree</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-white/70">{nodeInfo.metrics.outDegree}</div>
                <div className="text-[9px] text-white/25 uppercase">Out-Degree</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-white/70">{nodeInfo.metrics.degree}</div>
                <div className="text-[9px] text-white/25 uppercase">Total Degree</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-white/70">{nodeInfo.metrics.betweenness}</div>
                <div className="text-[9px] text-white/25 uppercase">Betweenness</div>
              </div>
            </div>
          )}

          {nodeInfo.node.metrics && Object.keys(nodeInfo.node.metrics).length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3 border-t border-white/[0.06] pt-2">
              {Object.entries(nodeInfo.node.metrics).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-sm text-white/60">{typeof val === "number" ? val.toFixed(2) : val}</div>
                  <div className="text-[9px] text-white/25 uppercase">{key}</div>
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
                    {e.type === "negative" ? "\u2212" : "+"}
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
                    {e.type === "negative" ? "\u2212" : "+"}
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
