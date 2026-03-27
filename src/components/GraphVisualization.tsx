"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceLayout from "graphology-layout-force";
import FA2Layout from "graphology-layout-forceatlas2";
import louvain from "graphology-communities-louvain";
import { degreeCentrality } from "graphology-metrics/centrality/degree";
import { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";

interface GraphNode {
  id: string;
  label: string;
  category: string;
  size: number;
  description?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface GraphData {
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphVisualizationProps {
  data: GraphData;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  person: "#E57373",
  concept: "#64B5F6",
  topic: "#81C784",
  event: "#FFB74D",
  technology: "#BA68C8",
  place: "#4DB6AC",
  organization: "#FF8A65",
  emotion: "#F06292",
  action: "#AED581",
  object: "#90A4AE",
  default: "#78909C",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

export default function GraphVisualization({ data, onClose }: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"force" | "forceatlas2" | "circular">("forceatlas2");
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0, communities: 0 });

  // Get all unique categories
  const categories = Array.from(new Set(data.nodes.map((n) => n.category)));

  // Initialize categories on mount
  useEffect(() => {
    setActiveCategories(new Set(categories));
  }, [data]);

  // Apply layout
  const applyLayout = useCallback((graph: Graph, mode: string) => {
    const nodeCount = graph.order;
    if (nodeCount === 0) return;

    if (mode === "circular") {
      const radius = Math.max(200, nodeCount * 30);
      let i = 0;
      graph.forEachNode((node) => {
        const angle = (2 * Math.PI * i) / nodeCount;
        graph.setNodeAttribute(node, "x", radius * Math.cos(angle));
        graph.setNodeAttribute(node, "y", radius * Math.sin(angle));
        i++;
      });
    } else if (mode === "force") {
      // Random initial positions
      graph.forEachNode((node) => {
        if (!graph.getNodeAttribute(node, "x")) {
          graph.setNodeAttribute(node, "x", Math.random() * 500 - 250);
          graph.setNodeAttribute(node, "y", Math.random() * 500 - 250);
        }
      });
      forceLayout.assign(graph, {
        maxIterations: 200,
        settings: {
          gravity: 10,
          repulsion: 0.5,
          attraction: 0.005,
        },
      });
    } else {
      // ForceAtlas2
      graph.forEachNode((node) => {
        if (!graph.getNodeAttribute(node, "x")) {
          graph.setNodeAttribute(node, "x", Math.random() * 500 - 250);
          graph.setNodeAttribute(node, "y", Math.random() * 500 - 250);
        }
      });
      FA2Layout.assign(graph, {
        iterations: 100,
        settings: {
          gravity: 5,
          scalingRatio: 10,
          barnesHutOptimize: true,
          strongGravityMode: true,
        },
      });
    }
  }, []);

  // Initialize graph and sigma
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = new Graph({ multi: true });
    graphRef.current = graph;

    // Add nodes
    data.nodes.forEach((node) => {
      const color = getCategoryColor(node.category);
      graph.addNode(node.id, {
        label: node.label,
        size: Math.max(5, Math.min(25, node.size || 10)),
        color,
        category: node.category,
        description: node.description || "",
        borderColor: color,
        borderSize: 0.15,
        type: "bordered",
        x: 0,
        y: 0,
      });
    });

    // Add edges
    data.edges.forEach((edge, idx) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdgeWithKey(`edge-${idx}`, edge.source, edge.target, {
          label: edge.label,
          size: Math.max(1, Math.min(5, edge.weight || 1)),
          color: "#999999",
          weight: edge.weight || 1,
          type: "curvedArrow",
          forceLabel: true,
        });
      }
    });

    // Apply layout
    applyLayout(graph, layoutMode);

    // Run community detection
    let communityCount = 0;
    try {
      louvain.assign(graph);
      const communities = new Set<number>();
      graph.forEachNode((node) => {
        const community = graph.getNodeAttribute(node, "community");
        if (community !== undefined) communities.add(community);
      });
      communityCount = communities.size;
    } catch {
      // Community detection may fail on disconnected graphs
    }

    // Calculate centrality for sizing
    try {
      const centralities = degreeCentrality(graph);
      const maxCentrality = Math.max(...Object.values(centralities), 0.01);
      Object.entries(centralities).forEach(([node, centrality]) => {
        const baseSize = graph.getNodeAttribute(node, "size") || 10;
        const centralityBoost = (centrality / maxCentrality) * 8;
        graph.setNodeAttribute(node, "size", baseSize + centralityBoost);
      });
    } catch {
      // Centrality calc may fail
    }

    setGraphStats({
      nodes: graph.order,
      edges: graph.size,
      communities: communityCount,
    });

    // Create sigma instance with all features
    const NodeBorderProgram = createNodeBorderProgram({
      borders: [
        { size: { value: 0.15, mode: "relative" }, color: { attribute: "borderColor" } },
      ],
    });

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: showEdgeLabels,
      renderLabels: showNodeLabels,
      labelFont: "Plus Jakarta Sans, sans-serif",
      labelSize: 14,
      labelWeight: "500",
      labelColor: { color: "#2C2824" },
      edgeLabelFont: "Plus Jakarta Sans, sans-serif",
      edgeLabelSize: 11,
      edgeLabelWeight: "400",
      edgeLabelColor: { color: "#666666" },
      labelRenderedSizeThreshold: 4,
      defaultEdgeType: "curvedArrow",
      defaultNodeType: "bordered",
      nodeProgramClasses: {
        bordered: NodeBorderProgram,
      },
      edgeProgramClasses: {
        curvedArrow: EdgeCurvedArrowProgram,
      },
      allowInvalidContainer: true,
      minCameraRatio: 0.05,
      maxCameraRatio: 10,
      zoomToSizeRatioFunction: (ratio: number) => Math.sqrt(ratio),
      nodeReducer: (node, attrs) => {
        const res = { ...attrs };

        // Handle category filtering
        if (activeCategories.size > 0) {
          const nodeCategory = graph.getNodeAttribute(node, "category");
          if (!activeCategories.has(nodeCategory)) {
            res.hidden = true;
            return res;
          }
        }

        // Handle search highlighting
        if (searchQuery) {
          const label = (attrs.label || "").toLowerCase();
          if (!label.includes(searchQuery.toLowerCase())) {
            res.color = "#E0E0E0";
            res.label = "";
          }
        }

        // Handle hover highlighting
        if (hoveredNode) {
          if (node === hoveredNode) {
            res.highlighted = true;
            res.size = (attrs.size || 10) * 1.3;
            res.zIndex = 1;
          } else if (graph.hasEdge(hoveredNode, node) || graph.hasEdge(node, hoveredNode) ||
                     graph.areNeighbors(hoveredNode, node)) {
            res.highlighted = true;
          } else {
            res.color = "#E0E0E0";
            res.label = "";
          }
        }

        // Handle selection
        if (selectedNode) {
          if (node === selectedNode) {
            res.highlighted = true;
            res.size = (attrs.size || 10) * 1.4;
            res.zIndex = 2;
          } else if (graph.areNeighbors(selectedNode, node)) {
            res.highlighted = true;
          } else {
            res.color = "#E0E0E0";
            res.label = "";
          }
        }

        return res;
      },
      edgeReducer: (edge, attrs) => {
        const res = { ...attrs };

        if (hoveredNode) {
          const source = graph.source(edge);
          const target = graph.target(edge);
          if (source !== hoveredNode && target !== hoveredNode) {
            res.hidden = true;
          } else {
            res.color = "#C48C56";
            res.size = Math.max((attrs.size || 1), 2);
          }
        }

        if (selectedNode) {
          const source = graph.source(edge);
          const target = graph.target(edge);
          if (source !== selectedNode && target !== selectedNode) {
            res.hidden = true;
          } else {
            res.color = "#C48C56";
            res.size = Math.max((attrs.size || 1), 2);
          }
        }

        return res;
      },
    });

    sigmaRef.current = renderer;

    // Enable drag
    let draggedNode: string | null = null;
    let isDragging = false;

    renderer.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      renderer.getCamera().disable();
    });

    renderer.getMouseCaptor().on("mousemovebody", (e) => {
      if (!isDragging || !draggedNode) return;
      const pos = renderer.viewportToGraph(e);
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);
      // Prevent sigma from moving the camera
      e.preventSigmaDefault();
      e.original.preventDefault();
      e.original.stopPropagation();
    });

    const handleMouseUp = () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }
      isDragging = false;
      draggedNode = null;
      renderer.getCamera().enable();
    };

    renderer.getMouseCaptor().on("mouseup", handleMouseUp);
    renderer.getMouseCaptor().on("mousedown", () => {
      // Allow for clicking on empty space to deselect
      if (!isDragging) {
        // Will be handled by clickStage
      }
    });

    // Hover events
    renderer.on("enterNode", ({ node }) => {
      setHoveredNode(node);
      const nodeData = data.nodes.find((n) => n.id === node);
      if (nodeData && containerRef.current) {
        const nodePosition = renderer.graphToViewport(
          graph.getNodeAttributes(node) as { x: number; y: number }
        );
        const containerRect = containerRef.current.getBoundingClientRect();
        setTooltipData({
          x: nodePosition.x + containerRect.left,
          y: nodePosition.y + containerRect.top - 10,
          node: nodeData,
        });
      }
      containerRef.current!.style.cursor = "pointer";
    });

    renderer.on("leaveNode", () => {
      setHoveredNode(null);
      setTooltipData(null);
      containerRef.current!.style.cursor = "default";
    });

    // Click events
    renderer.on("clickNode", ({ node }) => {
      setSelectedNode((prev) => (prev === node ? null : node));
    });

    renderer.on("clickStage", () => {
      setSelectedNode(null);
    });

    // Double click to zoom on node
    renderer.on("doubleClickNode", ({ node }) => {
      const nodePosition = graph.getNodeAttributes(node);
      renderer.getCamera().animate(
        { x: nodePosition.x as number, y: nodePosition.y as number, ratio: 0.3 },
        { duration: 600 }
      );
    });

    // Double click stage to reset
    renderer.on("doubleClickStage", () => {
      renderer.getCamera().animate({ x: 0.5, y: 0.5, ratio: 1 }, { duration: 600 });
    });

    return () => {
      renderer.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [data, layoutMode]);

  // Update sigma settings when toggles change
  useEffect(() => {
    if (sigmaRef.current) {
      sigmaRef.current.setSetting("renderEdgeLabels", showEdgeLabels);
      sigmaRef.current.setSetting("renderLabels", showNodeLabels);
      sigmaRef.current.refresh();
    }
  }, [showEdgeLabels, showNodeLabels]);

  // Refresh on filter/search changes
  useEffect(() => {
    if (sigmaRef.current) {
      sigmaRef.current.refresh();
    }
  }, [searchQuery, hoveredNode, selectedNode, activeCategories]);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const selectAllCategories = () => {
    setActiveCategories(new Set(categories));
  };

  const deselectAllCategories = () => {
    setActiveCategories(new Set());
  };

  const zoomIn = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animate({ ratio: camera.getState().ratio / 1.5 }, { duration: 300 });
    }
  };

  const zoomOut = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animate({ ratio: camera.getState().ratio * 1.5 }, { duration: 300 });
    }
  };

  const resetZoom = () => {
    if (sigmaRef.current) {
      sigmaRef.current.getCamera().animate({ x: 0.5, y: 0.5, ratio: 1 }, { duration: 300 });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    // Refresh sigma after resize
    setTimeout(() => {
      if (sigmaRef.current) {
        sigmaRef.current.refresh();
      }
    }, 100);
  };

  const focusOnNode = (nodeId: string) => {
    if (sigmaRef.current && graphRef.current) {
      const attrs = graphRef.current.getNodeAttributes(nodeId);
      sigmaRef.current.getCamera().animate(
        { x: attrs.x as number, y: attrs.y as number, ratio: 0.3 },
        { duration: 600 }
      );
      setSelectedNode(nodeId);
    }
  };

  // Get filtered nodes for search dropdown
  const filteredNodes = searchQuery
    ? data.nodes.filter((n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const selectedNodeData = selectedNode ? data.nodes.find((n) => n.id === selectedNode) : null;
  const selectedNodeEdges = selectedNode
    ? data.edges.filter((e) => e.source === selectedNode || e.target === selectedNode)
    : [];

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50"
          : "relative w-full rounded-2xl overflow-hidden"
      } bg-white/90 backdrop-blur-xl border border-black/10`}
      style={{ height: isFullscreen ? "100vh" : "600px" }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
              <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
            </svg>
            <h3
              className="text-sm font-semibold tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {data.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span>{graphStats.nodes} nodes</span>
            <span>|</span>
            <span>{graphStats.edges} edges</span>
            {graphStats.communities > 0 && (
              <>
                <span>|</span>
                <span>{graphStats.communities} communities</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Left Panel: Search + Filters */}
      <div className="absolute top-14 left-3 z-20 flex flex-col gap-2 max-h-[calc(100%-80px)] overflow-y-auto" style={{ width: "220px" }}>
        {/* Search */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-3 shadow-sm">
          <div className="relative">
            <svg className="absolute left-2 top-2 w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-black/5 rounded-lg outline-none placeholder:opacity-40"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
          {filteredNodes.length > 0 && searchQuery && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    focusOnNode(node.id);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-2 py-1 text-xs rounded-md hover:bg-black/5 flex items-center gap-2 transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(node.category) }}
                  />
                  <span className="truncate">{node.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium opacity-70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Categories
            </p>
            <div className="flex gap-1">
              <button
                onClick={selectAllCategories}
                className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                All
              </button>
              <button
                onClick={deselectAllCategories}
                className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                None
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all ${
                  activeCategories.has(cat) ? "bg-black/5" : "opacity-40"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: activeCategories.has(cat) ? getCategoryColor(cat) : "#ccc" }}
                />
                <span className="truncate capitalize">{cat}</span>
                <span className="ml-auto text-[10px] opacity-50">
                  {data.nodes.filter((n) => n.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-3 shadow-sm">
          <p className="text-xs font-medium opacity-70 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Display
          </p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <input
                type="checkbox"
                checked={showNodeLabels}
                onChange={() => setShowNodeLabels(!showNodeLabels)}
                className="w-3 h-3 rounded accent-[#C48C56]"
              />
              Node Labels
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <input
                type="checkbox"
                checked={showEdgeLabels}
                onChange={() => setShowEdgeLabels(!showEdgeLabels)}
                className="w-3 h-3 rounded accent-[#C48C56]"
              />
              Edge Labels
            </label>
          </div>
        </div>

        {/* Layout Options */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-3 shadow-sm">
          <p className="text-xs font-medium opacity-70 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Layout
          </p>
          <div className="space-y-1">
            {(["forceatlas2", "force", "circular"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`w-full text-left px-2 py-1 text-xs rounded-md transition-all capitalize ${
                  layoutMode === mode ? "bg-[#C48C56]/20 text-[#C48C56] font-medium" : "hover:bg-black/5"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {mode === "forceatlas2" ? "ForceAtlas2" : mode === "force" ? "Force Directed" : "Circular"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Zoom Controls */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-1">
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-black/5 shadow-sm overflow-hidden">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-black/5 transition-colors block"
            title="Zoom In"
          >
            <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3M8 11h6M11 8v6" />
            </svg>
          </button>
          <div className="h-px bg-black/5" />
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-black/5 transition-colors block"
            title="Zoom Out"
          >
            <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3M8 11h6" />
            </svg>
          </button>
          <div className="h-px bg-black/5" />
          <button
            onClick={resetZoom}
            className="p-2 hover:bg-black/5 transition-colors block"
            title="Reset View"
          >
            <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.5 5.5L5 7l2.5-2.5" /><path d="M3.5 18.5L5 17l2.5 2.5" />
              <path d="M20.5 5.5L19 7l-2.5-2.5" /><path d="M20.5 18.5L19 17l-2.5 2.5" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected Node Info Panel */}
      {selectedNodeData && (
        <div className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-4 shadow-lg" style={{ width: "260px" }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(selectedNodeData.category) }}
              />
              <h4 className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selectedNodeData.label}
              </h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-0.5 rounded hover:bg-black/5"
            >
              <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1 capitalize" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {selectedNodeData.category}
          </p>
          {selectedNodeData.description && (
            <p className="text-xs opacity-60 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {selectedNodeData.description}
            </p>
          )}
          {selectedNodeEdges.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Connections ({selectedNodeEdges.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedNodeEdges.map((edge, i) => {
                  const otherNodeId = edge.source === selectedNode ? edge.target : edge.source;
                  const otherNode = data.nodes.find((n) => n.id === otherNodeId);
                  return (
                    <button
                      key={i}
                      onClick={() => focusOnNode(otherNodeId)}
                      className="w-full text-left px-2 py-1 text-xs rounded-md hover:bg-black/5 flex items-center gap-2 transition-colors"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: otherNode ? getCategoryColor(otherNode.category) : "#999" }}
                      />
                      <span className="truncate">{otherNode?.label || otherNodeId}</span>
                      <span className="ml-auto text-[10px] opacity-40 truncate max-w-[80px]">{edge.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltipData && !selectedNode && (
        <div
          className="fixed z-50 pointer-events-none bg-[#2C2824]/90 text-white px-3 py-2 rounded-lg shadow-lg text-xs max-w-[200px]"
          style={{
            left: tooltipData.x + 15,
            top: tooltipData.y - 40,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <p className="font-medium">{tooltipData.node.label}</p>
          <p className="opacity-60 text-[10px] capitalize">{tooltipData.node.category}</p>
          {tooltipData.node.description && (
            <p className="mt-1 opacity-80 text-[10px]">{tooltipData.node.description}</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/80 backdrop-blur-md rounded-xl border border-black/5 px-3 py-2 shadow-sm">
        <p className="text-[10px] opacity-40 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Interactions
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span>Scroll: Zoom</span>
          <span>Drag canvas: Pan</span>
          <span>Drag node: Move</span>
          <span>Click: Select</span>
          <span>Dbl-click: Focus</span>
          <span>Hover: Highlight</span>
        </div>
      </div>

      {/* Sigma Container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
