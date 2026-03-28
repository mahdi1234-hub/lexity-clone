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
import { useOthers, useMyPresence, useSelf } from "../../liveblocks.config";
import CollaborationCursors from "./CollaborationCursors";
import CollaborationComments from "./CollaborationComments";
import AICanvasNode from "./AICanvasNode";

interface CollaborativeWhiteboardProps {
  roomId: string;
}

const nodeTypes: NodeTypes = {
  aiNode: AICanvasNode,
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

      {showComments && (
        <div className="absolute right-0 top-[52px] bottom-0 w-80 bg-[#2C2824]/95 backdrop-blur-xl border-l border-[#3D3530] overflow-hidden z-50">
          <CollaborationComments />
        </div>
      )}
    </div>
  );
}
