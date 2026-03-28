"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { signIn } from "next-auth/react";
import { useOthers, useMyPresence, useSelf } from "../../liveblocks.config";
import CollaborationCursors from "./CollaborationCursors";
import CollaborationComments from "./CollaborationComments";
import AICanvasNode from "./AICanvasNode";
import WidgetCanvasNode from "./WidgetCanvasNode";
import DataSelectorModal from "./DataSelectorModal";

interface CollaborativeWhiteboardProps {
  roomId: string;
}

const nodeTypes: NodeTypes = {
  aiNode: AICanvasNode,
  widgetNode: WidgetCanvasNode,
};

const initialNodes: Node[] = [
  {
    id: "welcome",
    type: "aiNode",
    position: { x: 0, y: 0 },
    data: {
      role: "system",
      content: "Welcome to your AI Canvas. Click anywhere to start a new topic, or use the input below to ask the AI.",
      timestamp: new Date().toISOString(),
      isWelcome: true,
    },
  },
];

export default function CollaborativeWhiteboard({ roomId }: CollaborativeWhiteboardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const others = useOthers();
  const self = useSelf();
  const [, updateMyPresence] = useMyPresence();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [selectorModal, setSelectorModal] = useState<{ type: string; title: string } | null>(null);
  const pendingWidgetType = useRef<string>("");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reactFlowInstance = useRef<any>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      });
    },
    [updateMyPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, style: { stroke: "#C48C56", strokeWidth: 2 } },
          eds
        )
      );
    },
    [setEdges]
  );

  const createNode = useCallback(
    async (message: string, parentId?: string, position?: { x: number; y: number }) => {
      if (!message.trim() || isGenerating) return;

      const nodeId = `node-${Date.now()}`;
      const responseNodeId = `response-${Date.now()}`;

      let nodePosition = position || { x: 0, y: 0 };
      if (parentId) {
        const parentNode = nodes.find((n) => n.id === parentId);
        if (parentNode) {
          const childCount = edges.filter((e) => e.source === parentId).length;
          nodePosition = {
            x: parentNode.position.x + childCount * 420,
            y: parentNode.position.y + 350,
          };
        }
      } else if (!position) {
        const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 0);
        nodePosition = { x: maxX + 500, y: 0 };
      }

      const userNode: Node = {
        id: nodeId,
        type: "aiNode",
        position: nodePosition,
        data: {
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
          userName: self?.info?.name || "You",
          userColor: self?.info?.color || "#C48C56",
        },
      };

      const aiNode: Node = {
        id: responseNodeId,
        type: "aiNode",
        position: { x: nodePosition.x, y: nodePosition.y + 250 },
        data: {
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          isLoading: true,
        },
      };

      setNodes((nds) => [...nds, userNode, aiNode]);

      const newEdges: Edge[] = [];
      if (parentId) {
        newEdges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          animated: true,
          style: { stroke: "#C48C56", strokeWidth: 2 },
        });
      }
      newEdges.push({
        id: `edge-${nodeId}-${responseNodeId}`,
        source: nodeId,
        target: responseNodeId,
        animated: true,
        style: { stroke: "#C48C56", strokeWidth: 2 },
      });

      setEdges((eds) => [...eds, ...newEdges]);
      setInput("");
      setIsGenerating(true);

      try {
        const formData = new FormData();
        formData.append("message", message);
        formData.append("conversationId", roomId);

        const res = await fetch("/api/chat", { method: "POST", body: formData });

        if (res.status === 429) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === responseNodeId
                ? { ...n, data: { ...n.data, content: "Daily message limit reached (5/5). Please try again tomorrow.", isLoading: false, isError: true } }
                : n
            )
          );
          setIsGenerating(false);
          return;
        }

        if (!res.ok) throw new Error("Failed");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === responseNodeId
                        ? { ...n, data: { ...n.data, content: fullContent, isLoading: false } }
                        : n
                    )
                  );
                }
              } catch { /* ignore */ }
            }
          }
        }
        // After streaming, parse widgets from AI response
        if (fullContent) {
          const widgetRegex = /:::(chart|widget|news|link|image|followup)\s*([\s\S]*?):::/g;
          let widgetMatch;
          let widgetIndex = 0;

          while ((widgetMatch = widgetRegex.exec(fullContent)) !== null) {
            try {
              const widgetData = JSON.parse(widgetMatch[2].trim());
              const widgetNodeId = `widget-${Date.now()}-${widgetIndex}`;
              const widgetNode: Node = {
                id: widgetNodeId,
                type: "widgetNode",
                position: {
                  x: nodePosition.x + 440 + widgetIndex * 420,
                  y: nodePosition.y + 250,
                },
                data: {
                  widgetType: widgetMatch[1] === "chart" ? widgetData.type || "bar" : widgetMatch[1],
                  ...widgetData,
                },
              };

              setNodes((nds) => [...nds, widgetNode]);
              setEdges((eds) => [
                ...eds,
                {
                  id: `edge-${responseNodeId}-${widgetNodeId}`,
                  source: responseNodeId,
                  target: widgetNodeId,
                  animated: true,
                  style: { stroke: "#7986CB", strokeWidth: 2 },
                },
              ]);
              widgetIndex++;
            } catch {
              // Invalid widget JSON, skip
            }
          }
        }
      } catch {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === responseNodeId
              ? { ...n, data: { ...n.data, content: "Failed to get AI response.", isLoading: false, isError: true } }
              : n
          )
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [nodes, edges, self, isGenerating, roomId, setNodes, setEdges]
  );

  // Manual widget creation (no AI needed)
  const addManualWidget = useCallback(
    async (widgetType: string) => {
      const center = reactFlowInstance.current?.getViewport();
      const position = center
        ? { x: -center.x / (center.zoom || 1) + 300, y: -center.y / (center.zoom || 1) + 200 }
        : { x: Math.random() * 500, y: Math.random() * 400 };

      const widgetNodeId = `manual-widget-${Date.now()}`;

      if (["gmail", "calendar", "tasks", "meet"].includes(widgetType)) {
        // Fetch Google Workspace data
        try {
          const res = await fetch("/api/google-workspace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: widgetType }),
          });
          const wsData = await res.json();

          if (!wsData.connected) {
            setGoogleConnected(false);
            // Show connect prompt widget
            const widgetNode: Node = {
              id: widgetNodeId,
              type: "widgetNode",
              position,
              data: {
                widgetType,
                title: widgetType === "gmail" ? "Gmail Inbox" : widgetType === "calendar" ? "Calendar Events" : widgetType === "tasks" ? "My Tasks" : "Google Meet",
                connected: false,
                onConnect: () => {
                  signIn("google", { callbackUrl: window.location.href });
                },
              },
            };
            setNodes((nds) => [...nds, widgetNode]);
          } else {
            setGoogleConnected(true);
            const widgetNode: Node = {
              id: widgetNodeId,
              type: "widgetNode",
              position,
              data: {
                widgetType,
                title: widgetType === "gmail" ? "Gmail Inbox" : widgetType === "calendar" ? "Upcoming Events" : widgetType === "tasks" ? "My Tasks" : "Upcoming Meetings",
                connected: true,
                emails: wsData.emails,
                events: wsData.events,
                tasks: wsData.tasks,
                meetings: wsData.meetings,
              },
            };
            setNodes((nds) => [...nds, widgetNode]);
          }
        } catch {
          const widgetNode: Node = {
            id: widgetNodeId,
            type: "widgetNode",
            position,
            data: {
              widgetType,
              title: widgetType.charAt(0).toUpperCase() + widgetType.slice(1),
              connected: false,
              onConnect: () => { signIn("google", { callbackUrl: window.location.href }); },
            },
          };
          setNodes((nds) => [...nds, widgetNode]);
        }
      } else if (widgetType === "chart") {
        // Add a sample chart widget
        const widgetNode: Node = {
          id: widgetNodeId,
          type: "widgetNode",
          position,
          data: {
            widgetType: "chart",
            chartType: "bar",
            title: "Sample Chart",
            description: "Drag to reposition. AI can generate custom data charts.",
            chartData: {
              items: [
                { label: "Mon", value: 40 },
                { label: "Tue", value: 65 },
                { label: "Wed", value: 55 },
                { label: "Thu", value: 80 },
                { label: "Fri", value: 45 },
              ],
              keys: ["value"],
              indexBy: "label",
            },
          },
        };
        setNodes((nds) => [...nds, widgetNode]);
      } else if (widgetType === "unsplash") {
        const widgetNode: Node = {
          id: widgetNodeId,
          type: "widgetNode",
          position,
          data: { widgetType: "unsplash", query: "" },
        };
        setNodes((nds) => [...nds, widgetNode]);
      } else if (widgetType === "table") {
        const sampleData = [
          { Name: "Item 1", Value: 100, Category: "A", Date: "2024-01-15" },
          { Name: "Item 2", Value: 250, Category: "B", Date: "2024-02-20" },
          { Name: "Item 3", Value: 180, Category: "A", Date: "2024-03-10" },
          { Name: "Item 4", Value: 320, Category: "C", Date: "2024-04-05" },
          { Name: "Item 5", Value: 95, Category: "B", Date: "2024-05-22" },
        ];
        const widgetNode: Node = {
          id: widgetNodeId,
          type: "widgetNode",
          position,
          data: { widgetType: "table", title: "Data Table", tableData: sampleData },
        };
        setNodes((nds) => [...nds, widgetNode]);
      } else if (widgetType === "sheets") {
        // Google Sheets - show connect prompt
        const widgetNode: Node = {
          id: widgetNodeId,
          type: "widgetNode",
          position,
          data: {
            widgetType: "calendar",
            title: "Google Sheets",
            connected: false,
            onConnect: () => { signIn("google", { callbackUrl: window.location.href }); },
          },
        };
        setNodes((nds) => [...nds, widgetNode]);
      } else if (widgetType === "note") {
        // Add a text note node
        const noteNode: Node = {
          id: widgetNodeId,
          type: "aiNode",
          position,
          data: {
            role: "system",
            content: "Double-click to edit this note...",
            timestamp: new Date().toISOString(),
            isWelcome: false,
          },
        };
        setNodes((nds) => [...nds, noteNode]);
      }

      setShowWidgetPanel(false);
    },
    [setNodes, setGoogleConnected, setShowWidgetPanel]
  );

  const onPaneClick = useCallback(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPaneDoubleClick = useCallback((event: any) => {
    if (!reactFlowInstance.current) return;
    const position = reactFlowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setSelectedNodeId(null);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.dataset.posX = String(position.x);
      inputRef.current.dataset.posY = String(position.y);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    let position: { x: number; y: number } | undefined;
    if (inputRef.current?.dataset.posX) {
      position = {
        x: parseFloat(inputRef.current.dataset.posX),
        y: parseFloat(inputRef.current.dataset.posY || "0"),
      };
      delete inputRef.current.dataset.posX;
      delete inputRef.current.dataset.posY;
    }
    createNode(input, selectedNodeId || undefined, position);
    setSelectedNodeId(null);
  }, [input, selectedNodeId, createNode]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.data.role === "assistant" && !node.data.isWelcome) {
      setSelectedNodeId(node.id);
      if (inputRef.current) inputRef.current.focus();
    }
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#1A1714]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2C2824] border-b border-[#3D3530] z-20">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-[#F2EFEA]/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            AI Canvas
          </h2>
          <span className="text-xs text-[#C48C56]/60 px-2 py-0.5 rounded-full bg-[#C48C56]/10">{roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2">
            {self && (
              <div
                className="w-7 h-7 rounded-full border-2 border-[#2C2824] flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: self.info?.color || "#C48C56" }}
                title={`${self.info?.name || "You"} (you)`}
              >
                {(self.info?.name || "Y")[0].toUpperCase()}
              </div>
            )}
            {others.map((other) => (
              <div
                key={other.connectionId}
                className="w-7 h-7 rounded-full border-2 border-[#2C2824] flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: other.info?.color || "#7986CB" }}
                title={other.info?.name || "Collaborator"}
              >
                {(other.info?.name || "?")[0].toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-[#F2EFEA]/40">{others.length + 1} online</span>
          <div className="h-4 w-px bg-[#3D3530]" />
          <button
            onClick={() => setShowWidgetPanel(!showWidgetPanel)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showWidgetPanel ? "bg-[#7986CB]/20 text-[#7986CB]" : "text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            + Widgets
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showComments ? "bg-[#C48C56]/20 text-[#C48C56]" : "text-[#F2EFEA]/40 hover:text-[#F2EFEA]/60"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Comments
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 relative" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onDoubleClick={onPaneDoubleClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onInit={(instance) => { reactFlowInstance.current = instance; }}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{ animated: true, style: { stroke: "#C48C56", strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
          className="bg-[#1A1714]"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#3D3530" />
          <Controls className="!bg-[#2C2824] !border-[#3D3530] !rounded-xl !shadow-xl [&>button]:!bg-[#2C2824] [&>button]:!border-[#3D3530] [&>button]:!text-[#F2EFEA]/60 [&>button:hover]:!bg-[#3D3530]" />
          <MiniMap
            className="!bg-[#2C2824] !border-[#3D3530] !rounded-xl"
            nodeColor={(n) => {
              if (n.data?.role === "user") return "#C48C56";
              if (n.data?.role === "assistant") return "#7986CB";
              return "#3D3530";
            }}
            maskColor="rgba(26, 23, 20, 0.8)"
          />
          {selectedNodeId && (
            <Panel position="top-center">
              <div className="flex items-center gap-2 bg-[#C48C56]/20 backdrop-blur-xl border border-[#C48C56]/30 rounded-xl px-4 py-2 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-[#C48C56] animate-pulse" />
                <span className="text-xs text-[#C48C56]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Branching from selected node
                </span>
                <button onClick={() => setSelectedNodeId(null)} className="text-xs text-[#C48C56]/60 hover:text-[#C48C56] ml-2">
                  Cancel
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
        <CollaborationCursors />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-[#2C2824] border-t border-[#3D3530] z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#1A1714] border border-[#3D3530] rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={selectedNodeId ? "Branch from this node..." : "Start a new topic or double-click canvas..."}
              className="flex-1 bg-transparent text-sm text-[#F2EFEA] placeholder-[#F2EFEA]/20 focus:outline-none"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              disabled={isGenerating}
            />
            {isGenerating && (
              <svg className="w-4 h-4 text-[#C48C56] animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="p-2.5 rounded-xl bg-[#C48C56] text-white transition-all hover:bg-[#C48C56]/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-[#F2EFEA]/20 mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Double-click canvas to place a node. Click an AI response to branch from it.
        </p>
      </div>

      {/* Data Selector Modal */}
      {selectorModal && (
        <DataSelectorModal
          type={selectorModal.type}
          title={selectorModal.title}
          onCancel={() => setSelectorModal(null)}
          onConfirm={() => {
            setSelectorModal(null);
            addManualWidget(pendingWidgetType.current);
          }}
        />
      )}

      {/* Widget Panel */}
      {showWidgetPanel && (
        <div className="absolute left-0 top-[52px] bottom-0 w-64 bg-[#2C2824]/95 backdrop-blur-xl border-r border-[#3D3530] overflow-y-auto z-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="px-4 py-3 border-b border-[#3D3530]">
            <h3 className="text-sm font-medium text-[#F2EFEA]/90">Add Widgets</h3>
            <p className="text-[10px] text-[#F2EFEA]/30 mt-0.5">Click to add to canvas</p>
          </div>

          {/* Google Workspace */}
          <div className="px-3 py-3">
            <p className="text-[10px] text-[#F2EFEA]/40 uppercase tracking-wider mb-2 px-1">Google Workspace</p>
            <div className="space-y-1">
              {[
                { type: "gmail", label: "Gmail Inbox", color: "#EA4335", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
                { type: "calendar", label: "Calendar", color: "#4285F4", icon: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" },
                { type: "tasks", label: "Tasks", color: "#4285F4", icon: "M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18z" },
                { type: "meet", label: "Google Meet", color: "#00832D", icon: "M12 3c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => { pendingWidgetType.current = item.type; setSelectorModal({ type: item.type, title: item.label }); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={item.color}><path d={item.icon} /></svg>
                  </div>
                  <div>
                    <span className="text-xs text-[#F2EFEA]/70">{item.label}</span>
                    {googleConnected && <span className="text-[8px] text-[#6B8E6B] ml-1.5">Connected</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Visualization */}
          <div className="px-3 py-3 border-t border-[#3D3530]/50">
            <p className="text-[10px] text-[#F2EFEA]/40 uppercase tracking-wider mb-2 px-1">Visualization</p>
            <div className="space-y-1">
              <button
                onClick={() => { pendingWidgetType.current = "chart"; setSelectorModal({ type: "chart", title: "Add Chart" }); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#C48C56]/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs text-[#F2EFEA]/70">Chart</span>
              </button>
            </div>
          </div>

          {/* Media */}
          <div className="px-3 py-3 border-t border-[#3D3530]/50">
            <p className="text-[10px] text-[#F2EFEA]/40 uppercase tracking-wider mb-2 px-1">Media</p>
            <div className="space-y-1">
              <button
                onClick={() => addManualWidget("unsplash")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#F2EFEA]/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#F2EFEA]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span className="text-xs text-[#F2EFEA]/70">Image Search</span>
              </button>
            </div>
          </div>

          {/* Data */}
          <div className="px-3 py-3 border-t border-[#3D3530]/50">
            <p className="text-[10px] text-[#F2EFEA]/40 uppercase tracking-wider mb-2 px-1">Data</p>
            <div className="space-y-1">
              <button
                onClick={() => { pendingWidgetType.current = "sheets"; setSelectorModal({ type: "sheets", title: "Google Sheets" }); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0F9D58]/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#0F9D58]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
                  </svg>
                </div>
                <span className="text-xs text-[#F2EFEA]/70">Google Sheets</span>
              </button>
              <button
                onClick={() => addManualWidget("table")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#BA68C8]/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#BA68C8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" />
                  </svg>
                </div>
                <span className="text-xs text-[#F2EFEA]/70">Data Table</span>
              </button>
            </div>
          </div>

          {/* Notes & Content */}
          <div className="px-3 py-3 border-t border-[#3D3530]/50">
            <p className="text-[10px] text-[#F2EFEA]/40 uppercase tracking-wider mb-2 px-1">Content</p>
            <div className="space-y-1">
              <button
                onClick={() => addManualWidget("note")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FFD54F]/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#FFD54F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>
                <span className="text-xs text-[#F2EFEA]/70">Note</span>
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#3D3530]/50">
            <p className="text-[10px] text-[#F2EFEA]/20 leading-relaxed">
              Tip: You can also ask the AI to generate charts, search results, and widgets automatically.
            </p>
          </div>
        </div>
      )}

      {showComments && (
        <div className="absolute right-0 top-[52px] bottom-0 w-80 bg-[#2C2824]/95 backdrop-blur-xl border-l border-[#3D3530] overflow-hidden z-50">
          <CollaborationComments />
        </div>
      )}
    </div>
  );
}
