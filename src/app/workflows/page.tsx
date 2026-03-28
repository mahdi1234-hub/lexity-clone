"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  WORKFLOW_NODES,
  NODE_CATEGORIES,
  getNodeDef,
  getCategoryColor,
  type WorkflowNodeDef,
  type WorkflowNodeParam,
} from "@/lib/workflow-nodes";

// ─── Custom Node Component ──────────────────────────────────

interface CustomNodeData {
  nodeType: string;
  label: string;
  params: Record<string, unknown>;
  status?: "idle" | "running" | "success" | "error";
  result?: { rowCount?: number; summary?: string };
  [key: string]: unknown;
}

function WorkflowNodeComponent({ data, selected }: NodeProps<Node<CustomNodeData>>) {
  const nodeDef = getNodeDef(data.nodeType);
  const catColor = getCategoryColor(nodeDef?.category || "");
  const inputCount = nodeDef?.inputs?.length || 0;
  const outputCount = nodeDef?.outputs?.length || 0;

  const statusColors: Record<string, string> = {
    idle: "transparent",
    running: "#F59E0B",
    success: "#10B981",
    error: "#EF4444",
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all min-w-[160px] ${selected ? "ring-2 ring-[#C48C56]/50" : ""}`}
      style={{
        borderColor: selected ? "#C48C56" : `${catColor}40`,
      }}
    >
      {/* Input handles */}
      {nodeDef?.inputs?.map((inp, i) => (
        <Handle
          key={`in-${inp.name}`}
          type="target"
          position={Position.Left}
          id={inp.name}
          style={{
            top: `${((i + 1) / (inputCount + 1)) * 100}%`,
            background: catColor,
            width: 10,
            height: 10,
            border: "2px solid white",
          }}
        />
      ))}
      {inputCount === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ background: catColor, width: 10, height: 10, border: "2px solid white" }}
        />
      )}

      {/* Header */}
      <div
        className="px-3 py-1.5 rounded-t-[10px] flex items-center gap-2"
        style={{ backgroundColor: `${catColor}15` }}
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={catColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={nodeDef?.icon || "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"} />
        </svg>
        <span className="text-xs font-semibold truncate" style={{ color: catColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {data.label}
        </span>
        {data.status && data.status !== "idle" && (
          <div
            className="w-2 h-2 rounded-full ml-auto flex-shrink-0"
            style={{ backgroundColor: statusColors[data.status] }}
          />
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-[10px] text-[#8B7B6B] truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {nodeDef?.category ? NODE_CATEGORIES.find(c => c.id === nodeDef.category)?.label : ""}
        </p>
        {data.result?.rowCount !== undefined && (
          <p className="text-[10px] text-[#10B981] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.result.rowCount} rows
          </p>
        )}
      </div>

      {/* Output handles */}
      {nodeDef?.outputs?.map((out, i) => (
        <Handle
          key={`out-${out.name}`}
          type="source"
          position={Position.Right}
          id={out.name}
          style={{
            top: `${((i + 1) / (outputCount + 1)) * 100}%`,
            background: catColor,
            width: 10,
            height: 10,
            border: "2px solid white",
          }}
        />
      ))}
      {outputCount === 0 && nodeDef?.outputs !== undefined && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ background: catColor, width: 10, height: 10, border: "2px solid white", opacity: 0 }}
        />
      )}
    </div>
  );
}

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

// ─── Types ──────────────────────────────────────────────────

interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecutionResults = Record<string, any>;

// ─── Main Page ──────────────────────────────────────────────

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Workflow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [workflowId, setWorkflowId] = useState(uuidv4());
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"nodes" | "workflows">("nodes");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["input-output"]));
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [resultsPanelOpen, setResultsPanelOpen] = useState(false);
  const [mapViewOpen, setMapViewOpen] = useState(false);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [executionError, setExecutionError] = useState("");

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reactFlowInstance = useRef<any>(null);

  // ─── Auth ───────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // ─── Load saved workflows ───────────────────────────────

  useEffect(() => {
    if (session) {
      fetch("/api/workflows")
        .then((r) => r.json())
        .then((data) => setSavedWorkflows(data.workflows || []))
        .catch(console.error);
    }
  }, [session]);

  // ─── Edge connection ────────────────────────────────────

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: "#C48C56", strokeWidth: 2 } }, eds));
    },
    [setEdges]
  );

  // ─── Node selection ─────────────────────────────────────

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const typedNode = node as Node<CustomNodeData>;
      setSelectedNode(typedNode);
      setConfigPanelOpen(true);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setConfigPanelOpen(false);
  }, []);

  // ─── Drag & Drop ────────────────────────────────────────

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeTypeId = event.dataTransfer.getData("application/reactflow-nodetype");
      if (!nodeTypeId || !reactFlowInstance.current) return;

      const nodeDef = getNodeDef(nodeTypeId);
      if (!nodeDef) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<CustomNodeData> = {
        id: `${nodeTypeId}-${uuidv4().slice(0, 8)}`,
        type: "workflowNode",
        position,
        data: {
          nodeType: nodeTypeId,
          label: nodeDef.label,
          params: nodeDef.params.reduce((acc, p) => {
            if (p.default !== undefined) acc[p.name] = p.default;
            return acc;
          }, {} as Record<string, unknown>),
          status: "idle",
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // ─── Save workflow ──────────────────────────────────────

  const saveWorkflow = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: workflowName,
          nodes,
          edges,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedWorkflows((prev) => {
          const filtered = prev.filter((w) => w.id !== workflowId);
          return [data.workflow, ...filtered];
        });
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [workflowId, workflowName, nodes, edges]);

  // ─── Load workflow ──────────────────────────────────────

  const loadWorkflow = useCallback((workflow: SavedWorkflow) => {
    setWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
    setExecutionResults(null);
    setExecutionError("");
    setSidebarTab("nodes");
  }, [setNodes, setEdges]);

  // ─── New workflow ───────────────────────────────────────

  const newWorkflow = useCallback(() => {
    setWorkflowId(uuidv4());
    setWorkflowName("Untitled Workflow");
    setNodes([]);
    setEdges([]);
    setExecutionResults(null);
    setExecutionError("");
    setSelectedNode(null);
    setConfigPanelOpen(false);
  }, [setNodes, setEdges]);

  // ─── Delete workflow ────────────────────────────────────

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      setSavedWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (workflowId === id) newWorkflow();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [workflowId, newWorkflow]);

  // ─── Execute workflow ───────────────────────────────────

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;
    setExecuting(true);
    setExecutionError("");
    setResultsPanelOpen(true);

    // Mark all nodes as running
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: "running" as const } }))
    );

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!res.ok) throw new Error("Execution failed");

      const data = await res.json();
      setExecutionResults(data);

      // Update node statuses
      setNodes((nds) =>
        nds.map((n) => {
          const nodeResult = data.results?.[n.id];
          return {
            ...n,
            data: {
              ...n.data,
              status: nodeResult?.status === "error" ? "error" as const : "success" as const,
              result: nodeResult || {},
            },
          };
        })
      );
    } catch (err) {
      console.error("Execution error:", err);
      setExecutionError("Failed to execute workflow. Please check your configuration.");
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, status: "error" as const } }))
      );
    } finally {
      setExecuting(false);
    }
  }, [nodes, edges, setNodes]);

  // ─── Update node params ─────────────────────────────────

  const updateNodeParams = useCallback(
    (nodeId: string, paramName: string, value: unknown) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, params: { ...n.data.params, [paramName]: value } } }
            : n
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, params: { ...prev.data.params, [paramName]: value } } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  // ─── Filtered nodes ─────────────────────────────────────

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return WORKFLOW_NODES;
    const q = searchQuery.toLowerCase();
    return WORKFLOW_NODES.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedNodes = useMemo(() => {
    const groups: Record<string, WorkflowNodeDef[]> = {};
    filteredNodes.forEach((n) => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return groups;
  }, [filteredNodes]);

  // ─── Toggle category ───────────────────────────────────

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  // ─── Drag start ─────────────────────────────────────────

  const onDragStart = useCallback((event: React.DragEvent, nodeTypeId: string) => {
    event.dataTransfer.setData("application/reactflow-nodetype", nodeTypeId);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  // ─── Loading / Auth ─────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col bg-[#F2EFEA] overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/60 backdrop-blur-xl border-b border-black/5 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            title="Back to Chat"
          >
            <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          >
            <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
            </svg>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-medium bg-transparent border-none outline-none text-[#2C2824] min-w-[200px]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2C2824]/70 hover:text-[#C48C56] hover:bg-[#C48C56]/10 rounded-lg transition-all"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Save
          </button>
          <button
            onClick={() => setMapViewOpen(!mapViewOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${mapViewOpen ? "bg-[#C48C56] text-white" : "text-[#2C2824]/70 hover:text-[#C48C56] hover:bg-[#C48C56]/10"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Map
          </button>
          <button
            onClick={executeWorkflow}
            disabled={executing || nodes.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#C48C56] text-white rounded-lg hover:bg-[#B07A48] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {executing ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {executing ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* ─── Main Layout ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Sidebar ───────────────────────────────────── */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 z-10`}>
          <div className="w-72 h-full flex flex-col bg-white/50 backdrop-blur-xl border-r border-black/5">
            {/* Sidebar tabs */}
            <div className="flex border-b border-black/5">
              <button
                onClick={() => setSidebarTab("nodes")}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "nodes" ? "text-[#C48C56] border-b-2 border-[#C48C56]" : "text-[#2C2824]/50 hover:text-[#2C2824]/80"}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Components
              </button>
              <button
                onClick={() => setSidebarTab("workflows")}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "workflows" ? "text-[#C48C56] border-b-2 border-[#C48C56]" : "text-[#2C2824]/50 hover:text-[#2C2824]/80"}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                My Workflows
              </button>
            </div>

            {sidebarTab === "nodes" ? (
              <>
                {/* Search */}
                <div className="p-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-black/5">
                    <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search components..."
                      className="flex-1 text-xs bg-transparent border-none outline-none placeholder:opacity-40"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>
                </div>

                {/* Node categories */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {NODE_CATEGORIES.map((cat) => {
                    const catNodes = groupedNodes[cat.id] || [];
                    if (catNodes.length === 0) return null;
                    const expanded = expandedCategories.has(cat.id);

                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/60 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-xs font-semibold text-[#2C2824]/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-[#8B7B6B]">({catNodes.length})</span>
                          </div>
                          <svg className={`w-3 h-3 opacity-40 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        {expanded && (
                          <div className="grid grid-cols-2 gap-1.5 px-1 py-1">
                            {catNodes.map((nodeDef) => (
                              <div
                                key={nodeDef.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, nodeDef.id)}
                                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/60 hover:bg-white/90 border border-transparent hover:border-[#C48C56]/20 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                                title={nodeDef.description}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${cat.color}12` }}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={nodeDef.icon} />
                                  </svg>
                                </div>
                                <span className="text-[9px] text-center text-[#2C2824]/70 leading-tight font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {nodeDef.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* ─── Saved Workflows ─────────────────────────── */
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <button
                  onClick={newWorkflow}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#C48C56]/10 text-[#C48C56] hover:bg-[#C48C56]/20 transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  New Workflow
                </button>

                {savedWorkflows.length === 0 && (
                  <p className="text-center text-xs opacity-40 mt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No saved workflows
                  </p>
                )}

                {savedWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className={`group p-3 rounded-xl cursor-pointer transition-all border ${workflowId === wf.id ? "bg-[#C48C56]/10 border-[#C48C56]/20" : "bg-white/40 border-transparent hover:bg-white/70"}`}
                    onClick={() => loadWorkflow(wf)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#2C2824] truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {wf.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(wf.id);
                        }}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#8B7B6B] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {(wf.nodes?.length || 0)} nodes &middot; {new Date(wf.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Canvas + Panels ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex">
            {/* React Flow Canvas */}
            <div className="flex-1 relative" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={(instance) => { reactFlowInstance.current = instance; }}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                defaultEdgeOptions={{ animated: true, style: { stroke: "#C48C56", strokeWidth: 2 } }}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#C48C5620" />
                <Controls
                  position="bottom-left"
                  style={{ background: "white", borderRadius: 12, border: "1px solid #0001", boxShadow: "0 2px 8px #0001" }}
                />
                <MiniMap
                  position="bottom-right"
                  style={{ background: "white", borderRadius: 12, border: "1px solid #0001" }}
                  nodeColor={(n) => {
                    const nd = getNodeDef((n as Node<CustomNodeData>).data?.nodeType || "");
                    return getCategoryColor(nd?.category || "");
                  }}
                />

                {/* Empty state */}
                {nodes.length === 0 && (
                  <Panel position="top-center">
                    <div className="flex flex-col items-center justify-center mt-32 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#C48C56]/10 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-[#2C2824]/60 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Drag & drop data sources or components
                      </p>
                      <p className="text-xs text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        from the left panel to get started
                      </p>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            </div>

            {/* ─── Config Panel ─────────────────────────────── */}
            {configPanelOpen && selectedNode && (
              <div className="w-80 bg-white/70 backdrop-blur-xl border-l border-black/5 overflow-y-auto flex-shrink-0">
                <NodeConfigPanel
                  node={selectedNode}
                  onUpdateParam={updateNodeParams}
                  onClose={() => {
                    setConfigPanelOpen(false);
                    setSelectedNode(null);
                  }}
                  onDelete={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                    setConfigPanelOpen(false);
                    setSelectedNode(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* ─── Results Panel ────────────────────────────── */}
          {resultsPanelOpen && (
            <div className="h-64 bg-white/70 backdrop-blur-xl border-t border-black/5 overflow-hidden flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#2C2824]/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Results
                  </span>
                  {executing && (
                    <svg className="w-3 h-3 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => setResultsPanelOpen(false)}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {executionError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {executionError}
                  </div>
                )}
                {!executionError && !executionResults && !executing && (
                  <p className="text-xs text-[#8B7B6B] text-center mt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Workflow has not been executed
                  </p>
                )}
                {executionResults && (
                  <div className="space-y-3">
                    {executionResults.finalOutput && (
                      <div className="p-3 rounded-lg bg-[#C48C56]/5 border border-[#C48C56]/15">
                        <p className="text-xs font-semibold text-[#C48C56] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Workflow Complete
                        </p>
                        <p className="text-xs text-[#2C2824]/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {executionResults.finalOutput.summary}
                        </p>
                        {executionResults.finalOutput.totalRows !== undefined && (
                          <p className="text-[10px] text-[#8B7B6B] mt-1">
                            Total rows: {executionResults.finalOutput.totalRows} &middot; Est. time: {executionResults.finalOutput.executionTime}
                          </p>
                        )}
                      </div>
                    )}
                    {executionResults.results && Object.entries(executionResults.results).map(([nodeId, result]) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const r = result as any;
                      return (
                        <div key={nodeId} className="p-2 rounded-lg bg-white/60 border border-black/5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${r.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-[10px] font-mono text-[#8B7B6B]">{nodeId}</span>
                            {r.rowCount !== undefined && (
                              <span className="text-[10px] text-[#2C2824]/50">{r.rowCount} rows</span>
                            )}
                          </div>
                          {r.summary && (
                            <p className="text-[10px] text-[#2C2824]/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {r.summary}
                            </p>
                          )}
                          {r.columns && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.columns.slice(0, 8).map((col: string) => (
                                <span key={col} className="text-[9px] px-1.5 py-0.5 bg-[#4A90D9]/10 text-[#4A90D9] rounded font-mono">
                                  {col}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Bottom Status Bar ────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-white/40 border-t border-black/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setResultsPanelOpen(!resultsPanelOpen)}
                className="text-[10px] text-[#8B7B6B] hover:text-[#C48C56] transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Results {executionResults ? "(ready)" : ""}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {nodes.length} nodes &middot; {edges.length} connections
              </span>
            </div>
          </div>
        </div>

        {/* ─── Map View Panel ────────────────────────────── */}
        {mapViewOpen && (
          <div className="w-[500px] bg-white/70 backdrop-blur-xl border-l border-black/5 flex flex-col flex-shrink-0 z-10">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
              <span className="text-xs font-semibold text-[#2C2824]/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Map View
              </span>
              <button
                onClick={() => setMapViewOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 relative bg-[#E8E4DE]">
              {executionResults?.results ? (
                <MapPreview results={executionResults.results} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-[#C48C56]/30 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
                    </svg>
                    <p className="text-xs text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Run the workflow to see map results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Node Config Panel Component ──────────────────────────

function NodeConfigPanel({
  node,
  onUpdateParam,
  onClose,
  onDelete,
}: {
  node: Node<CustomNodeData>;
  onUpdateParam: (nodeId: string, paramName: string, value: unknown) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const nodeDef = getNodeDef(node.data.nodeType);
  const catColor = getCategoryColor(nodeDef?.category || "");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/5" style={{ backgroundColor: `${catColor}08` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={catColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={nodeDef?.icon || ""} />
            </svg>
            <span className="text-sm font-semibold" style={{ color: catColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {nodeDef?.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {nodeDef?.description}
        </p>
      </div>

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {nodeDef?.params.map((param) => (
          <ParamField
            key={param.name}
            param={param}
            value={node.data.params[param.name]}
            onChange={(val) => onUpdateParam(node.id, param.name, val)}
            color={catColor}
          />
        ))}

        {nodeDef?.params.length === 0 && (
          <p className="text-xs text-[#8B7B6B] text-center py-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            No configuration needed
          </p>
        )}

        {/* Node info */}
        <div className="pt-3 border-t border-black/5 space-y-1">
          <p className="text-[10px] text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ID: <span className="font-mono">{node.id}</span>
          </p>
          <p className="text-[10px] text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Inputs: {nodeDef?.inputs.map((i) => i.name).join(", ") || "none"}
          </p>
          <p className="text-[10px] text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Outputs: {nodeDef?.outputs.map((o) => o.name).join(", ") || "none"}
          </p>
        </div>
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-black/5">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Delete Node
        </button>
      </div>
    </div>
  );
}

// ─── Parameter Field Component ────────────────────────────

function ParamField({
  param,
  value,
  onChange,
  color,
}: {
  param: WorkflowNodeParam;
  value: unknown;
  onChange: (val: unknown) => void;
  color: string;
}) {
  const baseInputClass = "w-full px-3 py-2 text-xs bg-white/60 rounded-lg border border-black/10 outline-none focus:border-[#C48C56] focus:ring-1 focus:ring-[#C48C56]/20 transition-all";

  return (
    <div>
      <label className="flex items-center gap-1 mb-1">
        <span className="text-[10px] font-semibold text-[#2C2824]/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {param.label}
        </span>
        {param.required && <span className="text-[10px]" style={{ color }}>*</span>}
      </label>
      {param.description && (
        <p className="text-[9px] text-[#8B7B6B] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {param.description}
        </p>
      )}

      {param.type === "text" || param.type === "column" ? (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.label}
          className={baseInputClass}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />
      ) : param.type === "number" ? (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={baseInputClass}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />
      ) : param.type === "select" ? (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {param.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : param.type === "boolean" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-black/20 text-[#C48C56] focus:ring-[#C48C56]/20"
          />
          <span className="text-xs text-[#2C2824]/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Enabled
          </span>
        </label>
      ) : param.type === "sql" || param.type === "json" ? (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={param.type === "sql" ? "Enter SQL..." : "Enter JSON..."}
          className={`${baseInputClass} font-mono resize-y`}
          style={{ fontSize: 11 }}
        />
      ) : (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />
      )}
    </div>
  );
}

// ─── Map Preview Component ────────────────────────────────

function MapPreview({ results }: { results: ExecutionResults }) {
  // Find any GeoJSON results to display
  const geoResults = Object.entries(results)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([, r]: [string, any]) => r.geojson || r.sampleData)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([id, r]: [string, any]) => ({ id, data: r }));

  if (geoResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <svg className="w-10 h-10 text-[#C48C56]/30 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-[#8B7B6B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            No spatial data in results
          </p>
          <p className="text-[10px] text-[#8B7B6B]/60 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Add spatial nodes to see map output
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-gradient-to-br from-[#E8E4DE] to-[#D4D0CA] overflow-auto">
        {/* Simple map visualization of results */}
        <div className="p-4 space-y-3">
          {geoResults.map((gr) => (
            <div key={gr.id} className="bg-white/80 rounded-xl p-4 border border-black/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4A90D9]" />
                <span className="text-xs font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {gr.id}
                </span>
                {gr.data.rowCount !== undefined && (
                  <span className="text-[10px] text-[#8B7B6B]">({gr.data.rowCount} features)</span>
                )}
              </div>
              {gr.data.summary && (
                <p className="text-[10px] text-[#8B7B6B] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {gr.data.summary}
                </p>
              )}
              {gr.data.geojson && (
                <div className="bg-[#F5F3EE] rounded-lg p-2 max-h-40 overflow-auto">
                  <pre className="text-[9px] font-mono text-[#2C2824]/60 whitespace-pre-wrap">
                    {JSON.stringify(gr.data.geojson, null, 2).slice(0, 1000)}
                    {JSON.stringify(gr.data.geojson).length > 1000 ? "\n..." : ""}
                  </pre>
                </div>
              )}
              {gr.data.sampleData && !gr.data.geojson && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px] border-collapse">
                    <thead>
                      <tr>
                        {gr.data.columns?.slice(0, 6).map((col: string) => (
                          <th key={col} className="p-1 text-left font-semibold text-[#4A90D9] border-b border-black/5">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {gr.data.sampleData.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i}>
                          {gr.data.columns?.slice(0, 6).map((col: string) => (
                            <td key={col} className="p-1 text-[#2C2824]/60 border-b border-black/3">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
