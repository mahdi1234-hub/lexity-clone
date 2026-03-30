"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Cosmograph,
  CosmographProvider,
  CosmographSearch,
  CosmographHistogram,
  CosmographButtonFitView,
  CosmographButtonZoomInOut,
  CosmographRef,
} from "@cosmograph/react";

// Types for graph data from API
interface GraphNode {
  id: string;
  label: string;
  category: string;
  size: number;
  x?: number;
  y?: number;
  properties?: Record<string, string | number>;
  cluster?: number;
  degree?: number;
  pagerank?: number;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  weight?: number;
  label?: string;
  [key: string]: unknown;
}

interface TopNode {
  id: string;
  label: string;
  metric: string;
  value: number;
}

interface ClusterInfo {
  cluster: number;
  size: number;
  label: string;
}

interface DegreeDistItem {
  degree: number;
  count: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  color: string;
}

interface GraphAnalytics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  avgDegree: number;
  maxDegree: number;
  clusters: number;
  modularity: number;
  avgPathLength: number;
  diameter: number;
  components: number;
  topNodes: TopNode[];
  clusterSizes: ClusterInfo[];
  degreeDistribution: DegreeDistItem[];
  categoryBreakdown: CategoryBreakdown[];
}

interface EmbeddingInfo {
  method: string;
  dimensions: number;
  description: string;
}

interface GraphMetadata {
  filename: string;
  totalRows: number;
  analyzedRows: number;
  generatedAt: string;
}

export interface CosmographAnalyticsData {
  nodes: GraphNode[];
  links: GraphLink[];
  analytics: GraphAnalytics;
  embeddings: EmbeddingInfo;
  summary: string;
  metadata: GraphMetadata;
}

interface CosmographAnalyticsProps {
  data: CosmographAnalyticsData;
  onClose: () => void;
}

// Color palette
const COLOR_PALETTE = [
  "#C48C56", "#7986CB", "#4FC3F7", "#81C784", "#E57373",
  "#BA68C8", "#FFD54F", "#4DD0E1", "#FF8A65", "#AED581",
  "#9575CD", "#F06292", "#DCE775", "#FFB74D", "#64B5F6",
  "#A1887F",
];

const CATEGORY_COLORS: Record<string, string> = {};
function getCategoryColor(category: string): string {
  if (!CATEGORY_COLORS[category]) {
    const idx = Object.keys(CATEGORY_COLORS).length % COLOR_PALETTE.length;
    CATEGORY_COLORS[category] = COLOR_PALETTE[idx];
  }
  return CATEGORY_COLORS[category];
}

// Widget Card
function WidgetCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#2C2824]/80 backdrop-blur-xl rounded-xl border border-[#3D3530] p-3 ${className}`}>
      <h4 className="text-[10px] uppercase tracking-wider text-[#F2EFEA]/40 font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function MetricDisplay({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-[11px] text-[#F2EFEA]/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</span>
      <span className="text-sm font-medium text-[#F2EFEA]/90 tabular-nums" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {typeof value === "number" ? (value % 1 === 0 ? value.toLocaleString() : value.toFixed(3)) : value}
        {unit && <span className="text-[10px] text-[#F2EFEA]/30 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

function MiniBarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal: number }) {
  return (
    <div className="space-y-1.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-[#F2EFEA]/50 w-20 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {item.label}
          </span>
          <div className="flex-1 h-3 bg-[#1A1714] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(2, (item.value / maxVal) * 100)}%`, backgroundColor: item.color || "#C48C56" }}
            />
          </div>
          <span className="text-[10px] text-[#F2EFEA]/40 w-8 text-right tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CosmographAnalytics({ data, onClose }: CosmographAnalyticsProps) {
  const cosmographRef = useRef<CosmographRef>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activePanel, setActivePanel] = useState<"analytics" | "embeddings" | "clusters" | "nodes">("analytics");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { nodes, links, analytics, embeddings, summary, metadata } = data;

  // Assign colors to nodes
  const coloredNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      color: getCategoryColor(n.category),
    }));
  }, [nodes]);

  // Convert nodes to Cosmograph flat records
  const pointsData = useMemo(() => {
    const filtered = filterCategory ? coloredNodes.filter((n) => n.category === filterCategory) : coloredNodes;
    return filtered.map((n) => ({
      id: n.id,
      label: n.label,
      category: n.category,
      size: n.size || 1,
      color: n.color || "#C48C56",
      cluster: n.cluster ?? 0,
      degree: n.degree ?? 0,
      pagerank: n.pagerank ?? 0,
      ...n.properties,
    }));
  }, [coloredNodes, filterCategory]);

  // Convert links to Cosmograph flat records
  const linksData = useMemo(() => {
    const nodeIds = new Set(pointsData.map((p) => p.id));
    return links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        weight: l.weight ?? 0.5,
        label: l.label ?? "",
      }));
  }, [links, pointsData]);

  const categories = useMemo(() => {
    const cats = new Set(nodes.map((n) => n.category));
    return Array.from(cats);
  }, [nodes]);

  // Top nodes
  const topPageRankNodes = useMemo(() => {
    return [...nodes].sort((a, b) => (b.pagerank || 0) - (a.pagerank || 0)).slice(0, 10);
  }, [nodes]);

  const degreeChartData = useMemo(() => {
    if (!analytics?.degreeDistribution) return [];
    return analytics.degreeDistribution
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((d) => ({ label: `Deg ${d.degree}`, value: d.count }));
  }, [analytics]);

  // Neighbors of selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const neighborIds = new Set<string>();
    links.forEach((l) => {
      if (l.source === selectedNode.id) neighborIds.add(l.target);
      if (l.target === selectedNode.id) neighborIds.add(l.source);
    });
    return nodes.filter((n) => neighborIds.has(n.id));
  }, [selectedNode, links, nodes]);

  // Handle Cosmograph point click
  const handleClick = useCallback(
    (index: number | undefined) => {
      if (index !== undefined && index < pointsData.length) {
        const pointId = pointsData[index]?.id;
        const node = nodes.find((n) => n.id === pointId);
        if (node) setSelectedNode(node);
      }
    },
    [pointsData, nodes]
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1714] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2C2824] border-b border-[#3D3530]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-[#F2EFEA]/40 hover:text-[#F2EFEA]/70 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-medium text-[#F2EFEA]/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Graph Network Analytics
            </h2>
            <p className="text-[10px] text-[#F2EFEA]/30" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {metadata?.filename} &middot; {analytics?.totalNodes} nodes &middot; {analytics?.totalEdges} edges
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-[#3D3530] bg-[#1A1714]/80 backdrop-blur-xl">
          <div className="flex border-b border-[#3D3530] sticky top-0 bg-[#1A1714]/95 backdrop-blur-xl z-10">
            {(["analytics", "embeddings", "clusters", "nodes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-medium transition-colors ${
                  activePanel === tab ? "text-[#C48C56] border-b-2 border-[#C48C56]" : "text-[#F2EFEA]/30 hover:text-[#F2EFEA]/50"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3">
            {activePanel === "analytics" && (
              <>
                <WidgetCard title="AI Analysis Summary">
                  <p className="text-[11px] text-[#F2EFEA]/60 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {summary}
                  </p>
                </WidgetCard>

                <WidgetCard title="Graph Metrics">
                  <MetricDisplay label="Nodes" value={analytics?.totalNodes || 0} />
                  <MetricDisplay label="Edges" value={analytics?.totalEdges || 0} />
                  <MetricDisplay label="Density" value={analytics?.density || 0} />
                  <MetricDisplay label="Avg Degree" value={analytics?.avgDegree || 0} />
                  <MetricDisplay label="Max Degree" value={analytics?.maxDegree || 0} />
                  <MetricDisplay label="Components" value={analytics?.components || 0} />
                  <MetricDisplay label="Modularity" value={analytics?.modularity || 0} />
                  <MetricDisplay label="Avg Path Length" value={analytics?.avgPathLength || 0} />
                  <MetricDisplay label="Diameter" value={analytics?.diameter || 0} />
                </WidgetCard>

                <WidgetCard title="Categories">
                  <div className="space-y-1">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                        !filterCategory ? "bg-[#C48C56]/20 text-[#C48C56]" : "text-[#F2EFEA]/50 hover:bg-[#F2EFEA]/5"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#C48C56] to-[#7986CB]" />
                      All ({nodes.length})
                    </button>
                    {analytics?.categoryBreakdown?.map((cat) => (
                      <button
                        key={cat.category}
                        onClick={() => setFilterCategory(filterCategory === cat.category ? null : cat.category)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                          filterCategory === cat.category ? "bg-[#C48C56]/20 text-[#C48C56]" : "text-[#F2EFEA]/50 hover:bg-[#F2EFEA]/5"
                        }`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || getCategoryColor(cat.category) }} />
                        <span className="truncate">{cat.category}</span>
                        <span className="ml-auto text-[#F2EFEA]/30">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                </WidgetCard>

                {degreeChartData.length > 0 && (
                  <WidgetCard title="Degree Distribution">
                    <MiniBarChart data={degreeChartData} maxVal={Math.max(...degreeChartData.map((d) => d.value))} />
                  </WidgetCard>
                )}

                <WidgetCard title="Top Nodes (PageRank)">
                  {analytics?.topNodes?.slice(0, 8).map((tn, i) => (
                    <div
                      key={tn.id}
                      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F2EFEA]/5 rounded px-1 -mx-1 transition-colors"
                      onClick={() => { const node = nodes.find((n) => n.id === tn.id); if (node) setSelectedNode(node); }}
                    >
                      <span className="text-[10px] text-[#F2EFEA]/25 w-4">{i + 1}</span>
                      <span className="text-[11px] text-[#F2EFEA]/70 flex-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tn.label}</span>
                      <span className="text-[10px] text-[#C48C56] tabular-nums">{tn.value?.toFixed(4)}</span>
                    </div>
                  ))}
                </WidgetCard>
              </>
            )}

            {activePanel === "embeddings" && (
              <>
                <WidgetCard title="ML Embedding Info">
                  <MetricDisplay label="Method" value={embeddings?.method || "N/A"} />
                  <MetricDisplay label="Dimensions" value={embeddings?.dimensions || 2} />
                  <p className="text-[11px] text-[#F2EFEA]/50 mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {embeddings?.description || "Embedding positions reflect data similarity."}
                  </p>
                </WidgetCard>

                <WidgetCard title="2D Embedding Space">
                  <div className="relative w-full aspect-square bg-[#1A1714] rounded-lg overflow-hidden border border-[#3D3530]">
                    <svg viewBox="-550 -550 1100 1100" className="w-full h-full">
                      <line x1="-500" y1="0" x2="500" y2="0" stroke="#3D3530" strokeWidth="0.5" />
                      <line x1="0" y1="-500" x2="0" y2="500" stroke="#3D3530" strokeWidth="0.5" />
                      {coloredNodes.map((node) => (
                        <circle
                          key={node.id}
                          cx={node.x || 0}
                          cy={node.y || 0}
                          r={Math.max(2, (node.size || 1) * 2)}
                          fill={getCategoryColor(node.category)}
                          opacity={0.7}
                          className="cursor-pointer hover:opacity-100"
                          onClick={() => setSelectedNode(node)}
                        >
                          <title>{node.label}</title>
                        </circle>
                      ))}
                    </svg>
                  </div>
                  <p className="text-[10px] text-[#F2EFEA]/30 mt-1 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Nodes closer together share more similarity
                  </p>
                </WidgetCard>

                <WidgetCard title="Cluster Separation">
                  {analytics?.clusterSizes?.map((cls) => (
                    <div key={cls.cluster} className="flex items-center gap-2 py-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_PALETTE[cls.cluster % COLOR_PALETTE.length] }} />
                      <span className="text-[11px] text-[#F2EFEA]/60 flex-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cls.label}</span>
                      <span className="text-[10px] text-[#F2EFEA]/30 tabular-nums">{cls.size} nodes</span>
                    </div>
                  ))}
                </WidgetCard>
              </>
            )}

            {activePanel === "clusters" && (
              <>
                <WidgetCard title="Cluster Overview">
                  <MetricDisplay label="Total Clusters" value={analytics?.clusters || 0} />
                  <MetricDisplay label="Modularity" value={analytics?.modularity || 0} />
                </WidgetCard>
                {analytics?.clusterSizes?.map((cls) => {
                  const clusterNodes = nodes.filter((n) => n.cluster === cls.cluster);
                  return (
                    <WidgetCard key={cls.cluster} title={cls.label || `Cluster ${cls.cluster}`}>
                      <MetricDisplay label="Size" value={cls.size} unit="nodes" />
                      <div className="mt-2 space-y-0.5">
                        {clusterNodes.slice(0, 5).map((n) => (
                          <div key={n.id} className="text-[11px] text-[#F2EFEA]/50 truncate cursor-pointer hover:text-[#C48C56] transition-colors"
                            onClick={() => setSelectedNode(n)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {n.label}
                          </div>
                        ))}
                        {clusterNodes.length > 5 && <div className="text-[10px] text-[#F2EFEA]/25">+{clusterNodes.length - 5} more</div>}
                      </div>
                    </WidgetCard>
                  );
                })}
              </>
            )}

            {activePanel === "nodes" && (
              <>
                <WidgetCard title="Top PageRank Nodes">
                  {topPageRankNodes.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#F2EFEA]/5 rounded px-1 -mx-1 transition-colors"
                      onClick={() => setSelectedNode(node)}>
                      <span className="text-[10px] text-[#F2EFEA]/25 w-5">{i + 1}.</span>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(node.category) }} />
                      <span className="text-[11px] text-[#F2EFEA]/70 flex-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{node.label}</span>
                      <span className="text-[10px] text-[#C48C56] tabular-nums">{(node.pagerank || 0).toFixed(4)}</span>
                    </div>
                  ))}
                </WidgetCard>
                <WidgetCard title="High Degree Nodes">
                  {[...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 10).map((node, i) => (
                    <div key={node.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#F2EFEA]/5 rounded px-1 -mx-1 transition-colors"
                      onClick={() => setSelectedNode(node)}>
                      <span className="text-[10px] text-[#F2EFEA]/25 w-5">{i + 1}.</span>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(node.category) }} />
                      <span className="text-[11px] text-[#F2EFEA]/70 flex-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{node.label}</span>
                      <span className="text-[10px] text-[#7986CB] tabular-nums">deg {node.degree || 0}</span>
                    </div>
                  ))}
                </WidgetCard>
              </>
            )}
          </div>
        </div>

        {/* Main Cosmograph View */}
        <div className="flex-1 relative bg-[#0D0B09]">
          <CosmographProvider>
            <Cosmograph
              ref={cosmographRef}
              className="w-full h-full"
              points={pointsData}
              pointIdBy="id"
              pointColorBy="color"
              pointSizeBy="size"
              pointSizeRange={[2, 20]}
              pointLabelBy="label"
              pointClusterBy="category"
              links={linksData}
              linkSourceBy="source"
              linkTargetBy="target"
              linkWidthBy="weight"
              linkWidthRange={[0.2, 3]}
              linkColor="rgba(196, 140, 86, 0.12)"
              backgroundColor="#0D0B09"
              showDynamicLabels={true}
              onClick={handleClick}
            />

            {/* Cosmograph Controls */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
              <CosmographButtonFitView className="w-8 h-8 bg-[#2C2824]/90 backdrop-blur-xl rounded-lg border border-[#3D3530] flex items-center justify-center text-[#F2EFEA]/50 hover:text-[#F2EFEA]/80 transition-colors" />
              <CosmographButtonZoomInOut className="bg-[#2C2824]/90 backdrop-blur-xl rounded-lg border border-[#3D3530] text-[#F2EFEA]/50" />
            </div>

            {/* Search */}
            <div className="absolute top-3 left-3 z-20 w-64">
              <CosmographSearch className="bg-[#2C2824]/90 backdrop-blur-xl rounded-lg border border-[#3D3530] text-[#F2EFEA] text-xs" />
            </div>

            {/* Histogram widget for degree distribution */}
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <CosmographHistogram
                className="bg-[#2C2824]/80 backdrop-blur-xl rounded-lg border border-[#3D3530] h-16"
              />
            </div>
          </CosmographProvider>

          {/* Legend */}
          <div className="absolute top-14 right-3 bg-[#2C2824]/90 backdrop-blur-xl rounded-xl border border-[#3D3530] p-3 z-10 max-w-[180px]">
            <h4 className="text-[10px] uppercase tracking-wider text-[#F2EFEA]/40 font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Legend
            </h4>
            <div className="space-y-1">
              {categories.slice(0, 10).map((cat) => (
                <div key={cat} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat) }} />
                  <span className={`text-[10px] truncate ${filterCategory === cat ? "text-[#C48C56]" : "text-[#F2EFEA]/50"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {cat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Node Panel */}
        {selectedNode && (
          <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-[#3D3530] bg-[#1A1714]/80 backdrop-blur-xl">
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-[#F2EFEA]/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Node Details</h3>
                <button onClick={() => setSelectedNode(null)} className="text-[#F2EFEA]/30 hover:text-[#F2EFEA]/60">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <WidgetCard title="Identity">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCategoryColor(selectedNode.category) }} />
                  <span className="text-sm font-medium text-[#F2EFEA]/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedNode.label}</span>
                </div>
                <MetricDisplay label="Category" value={selectedNode.category} />
                <MetricDisplay label="Cluster" value={selectedNode.cluster ?? "N/A"} />
                <MetricDisplay label="Degree" value={selectedNode.degree ?? 0} />
                <MetricDisplay label="PageRank" value={selectedNode.pagerank ?? 0} />
                <MetricDisplay label="Size" value={selectedNode.size ?? 1} />
              </WidgetCard>

              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <WidgetCard title="Properties">
                  {Object.entries(selectedNode.properties).map(([key, val]) => (
                    <MetricDisplay key={key} label={key} value={String(val)} />
                  ))}
                </WidgetCard>
              )}

              <WidgetCard title={`Neighbors (${selectedNeighbors.length})`}>
                {selectedNeighbors.length === 0 ? (
                  <p className="text-[10px] text-[#F2EFEA]/30">No connections</p>
                ) : (
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {selectedNeighbors.map((n) => (
                      <div key={n.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F2EFEA]/5 rounded px-1 -mx-1 transition-colors"
                        onClick={() => setSelectedNode(n)}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(n.category) }} />
                        <span className="text-[11px] text-[#F2EFEA]/60 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </WidgetCard>

              <WidgetCard title="Embedding Position">
                <MetricDisplay label="X" value={selectedNode.x ?? 0} />
                <MetricDisplay label="Y" value={selectedNode.y ?? 0} />
              </WidgetCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
