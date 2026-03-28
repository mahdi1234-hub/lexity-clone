"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  Panel,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AIResponseNode from "./nodes/AIResponseNode";
import ImageNode from "./nodes/ImageNode";
import WebLinkNode from "./nodes/WebLinkNode";
import ChartNode from "./nodes/ChartNode";
import WidgetNode from "./nodes/WidgetNode";
import TextNode from "./nodes/TextNode";
import GroupNode from "./nodes/GroupNode";
import AISidebar from "./AISidebar";

const nodeTypes: NodeTypes = {
  aiResponse: AIResponseNode,
  image: ImageNode,
  webLink: WebLinkNode,
  chart: ChartNode,
  widget: WidgetNode,
  text: TextNode,
  group: GroupNode,
} as unknown as NodeTypes;

interface SidebarMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  thinkingSteps?: {
    id: string;
    type: "thinking" | "tool_use" | "result" | "error";
    title: string;
    content: string;
    status: "pending" | "running" | "done" | "error";
    timestamp: string;
  }[];
  isStreaming?: boolean;
}

// Demo initial nodes showing the canvas capabilities
const demoNodes: Node[] = [
  {
    id: "welcome",
    type: "aiResponse",
    position: { x: 200, y: 100 },
    data: {
      content: "Welcome to the AI Canvas! This is your collaborative workspace. You can add notes, charts, widgets, images, and more. Use the sidebar to chat with the AI assistant and add content to your canvas.",
      model: "AI Assistant",
      timestamp: "Just now",
      isUser: false,
    },
  },
  {
    id: "chart-demo",
    type: "chart",
    position: { x: -200, y: 50 },
    data: {
      title: "Project Progress",
      chartType: "bar",
      chartData: {
        items: [
          { label: "Design", value: 85 },
          { label: "Frontend", value: 60 },
          { label: "Backend", value: 45 },
          { label: "Testing", value: 20 },
        ],
        keys: ["value"],
        indexBy: "label",
      },
      description: "Current sprint progress by team",
    },
  },
  {
    id: "email-widget",
    type: "widget",
    position: { x: 650, y: 80 },
    data: {
      widgetType: "email",
      title: "Recent Emails",
      items: [
        { id: "1", title: "Sprint planning notes", subtitle: "team@company.com", time: "5m ago", status: "unread" },
        { id: "2", title: "Design review feedback", subtitle: "design@company.com", time: "1h ago", status: "unread" },
        { id: "3", title: "Weekly report ready", subtitle: "reports@company.com", time: "3h ago", status: "read" },
      ],
    },
  },
  {
    id: "calendar-widget",
    type: "widget",
    position: { x: 650, y: 380 },
    data: {
      widgetType: "calendar",
      title: "Today's Schedule",
      items: [
        { id: "1", title: "Team standup", subtitle: "9:00 AM - 9:30 AM", time: "9:00", status: "done" },
        { id: "2", title: "Design review", subtitle: "2:00 PM - 3:00 PM", time: "14:00", status: "upcoming" },
        { id: "3", title: "Client call", subtitle: "4:00 PM - 4:30 PM", time: "16:00", status: "upcoming" },
      ],
    },
  },
  {
    id: "tasks-widget",
    type: "widget",
    position: { x: -200, y: 380 },
    data: {
      widgetType: "tasks",
      title: "My Tasks",
      items: [
        { id: "1", title: "Review pull request #142", status: "pending" },
        { id: "2", title: "Update API documentation", status: "done" },
        { id: "3", title: "Fix navigation bug", status: "pending" },
        { id: "4", title: "Deploy to staging", status: "pending" },
      ],
    },
  },
  {
    id: "note-1",
    type: "text",
    position: { x: 200, y: 400 },
    data: {
      title: "Quick Notes",
      content: "Double-click to edit this note.\n\nYou can create connections between nodes by dragging from the handles.",
      color: "#E8F5E9",
      editable: true,
    },
  },
  {
    id: "pie-chart",
    type: "chart",
    position: { x: -200, y: 680 },
    data: {
      title: "Budget Allocation",
      chartType: "pie",
      chartData: {
        items: [
          { id: "eng", label: "Engineering", value: 40 },
          { id: "design", label: "Design", value: 20 },
          { id: "marketing", label: "Marketing", value: 25 },
          { id: "ops", label: "Operations", value: 15 },
        ],
      },
    },
  },
  {
    id: "meet-widget",
    type: "widget",
    position: { x: 200, y: 680 },
    data: {
      widgetType: "meet",
      title: "Upcoming Meetings",
      items: [
        { id: "1", title: "Weekly team sync", subtitle: "In 25 minutes", time: "10:00", status: "upcoming" },
        { id: "2", title: "1:1 with manager", subtitle: "Tomorrow, 11:00 AM", time: "11:00", status: "upcoming" },
      ],
    },
  },
];

const demoEdges: Edge[] = [
  { id: "e-welcome-chart", source: "welcome", target: "chart-demo", type: "smoothstep", animated: true, style: { stroke: "#C48C56", strokeWidth: 1.5, opacity: 0.3 } },
  { id: "e-welcome-email", source: "welcome", target: "email-widget", type: "smoothstep", animated: true, style: { stroke: "#C48C56", strokeWidth: 1.5, opacity: 0.3 } },
  { id: "e-welcome-note", source: "welcome", target: "note-1", type: "smoothstep", style: { stroke: "#C48C56", strokeWidth: 1, opacity: 0.2 } },
];

interface CanvasWorkspaceProps {
  userName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CanvasWorkspace({ userName }: CanvasWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(demoNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(demoEdges);
  const [sidebarMessages, setSidebarMessages] = useState<SidebarMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const nodeCountRef = useRef(demoNodes.length);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: "smoothstep", animated: true, style: { stroke: "#C48C56", strokeWidth: 1.5, opacity: 0.4 } },
          eds
        )
      ),
    [setEdges]
  );

  // Get a good position for a new node
  const getNewNodePosition = useCallback(() => {
    const baseX = 100 + (nodeCountRef.current % 4) * 320;
    const baseY = 100 + Math.floor(nodeCountRef.current / 4) * 350;
    return { x: baseX + Math.random() * 50 - 25, y: baseY + Math.random() * 50 - 25 };
  }, []);

  const addNode = useCallback(
    (type: string, data: Record<string, unknown>) => {
      nodeCountRef.current += 1;
      const newNode: Node = {
        id: `node-${Date.now()}-${nodeCountRef.current}`,
        type,
        position: getNewNodePosition(),
        data,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNewNodePosition]
  );

  // Simulate AI processing for canvas mode
  const handleSendMessage = useCallback(
    async (message: string) => {
      const userMsg: SidebarMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSidebarMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      // Simulate AI chain of thought
      const assistantMsg: SidebarMessage = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thinkingSteps: [
          { id: "s1", type: "thinking", title: "Analyzing your request", content: "Understanding what to add to canvas...", status: "running", timestamp: "" },
          { id: "s2", type: "tool_use", title: "Preparing canvas content", content: "", status: "pending", timestamp: "" },
          { id: "s3", type: "result", title: "Adding to canvas", content: "", status: "pending", timestamp: "" },
        ],
        isStreaming: true,
      };

      setSidebarMessages((prev) => [...prev, assistantMsg]);

      // Step 1: Thinking
      await new Promise((r) => setTimeout(r, 800));
      setSidebarMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === "s1" ? { ...s, status: "done" as const } : s.id === "s2" ? { ...s, status: "running" as const, content: "Generating content..." } : s
                ),
              }
            : m
        )
      );

      // Step 2: Preparing
      await new Promise((r) => setTimeout(r, 600));
      setSidebarMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === "s2" ? { ...s, status: "done" as const } : s.id === "s3" ? { ...s, status: "running" as const, content: "Placing on canvas..." } : s
                ),
              }
            : m
        )
      );

      // Determine what to add based on message
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("chart") || lowerMsg.includes("graph") || lowerMsg.includes("data")) {
        addNode("chart", {
          title: "Generated Chart",
          chartType: lowerMsg.includes("pie") ? "pie" : lowerMsg.includes("line") ? "line" : "bar",
          chartData: lowerMsg.includes("pie")
            ? { items: [{ id: "a", label: "Category A", value: 35 }, { id: "b", label: "Category B", value: 25 }, { id: "c", label: "Category C", value: 40 }] }
            : lowerMsg.includes("line")
            ? { series: [{ id: "trend", data: [{ x: "Jan", y: 10 }, { x: "Feb", y: 25 }, { x: "Mar", y: 18 }, { x: "Apr", y: 32 }, { x: "May", y: 28 }] }] }
            : { items: [{ label: "Q1", value: 42 }, { label: "Q2", value: 58 }, { label: "Q3", value: 35 }, { label: "Q4", value: 67 }], keys: ["value"], indexBy: "label" },
          description: `Chart generated from: "${message}"`,
        });
      } else if (lowerMsg.includes("note") || lowerMsg.includes("text") || lowerMsg.includes("write")) {
        addNode("text", { title: "Note", content: message, color: "#FFF9C4", editable: true });
      } else if (lowerMsg.includes("email") || lowerMsg.includes("inbox")) {
        addNode("widget", {
          widgetType: "email",
          title: "Email Widget",
          items: [
            { id: "1", title: "New message from team", subtitle: "team@example.com", time: "Just now", status: "unread" },
          ],
        });
      } else if (lowerMsg.includes("calendar") || lowerMsg.includes("schedule") || lowerMsg.includes("event")) {
        addNode("widget", {
          widgetType: "calendar",
          title: "Calendar",
          items: [
            { id: "1", title: "New event", subtitle: "Today", time: "Now", status: "upcoming" },
          ],
        });
      } else if (lowerMsg.includes("task") || lowerMsg.includes("todo")) {
        addNode("widget", {
          widgetType: "tasks",
          title: "Tasks",
          items: [
            { id: "1", title: message, status: "pending" },
          ],
        });
      } else {
        // Default: add as AI response node
        addNode("aiResponse", {
          content: `Based on your request: "${message}"\n\nI've analyzed this and added it to your canvas. You can drag, resize, and connect this card with other elements on the canvas.`,
          model: "AI Assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isUser: false,
        });
      }

      // Step 3: Done
      await new Promise((r) => setTimeout(r, 400));
      setSidebarMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: `Done! I've added the content to your canvas based on your request. You can drag it around and connect it to other nodes.`,
                isStreaming: false,
                thinkingSteps: m.thinkingSteps?.map((s) =>
                  s.id === "s3" ? { ...s, status: "done" as const } : s
                ),
              }
            : m
        )
      );

      setIsProcessing(false);
    },
    [addNode]
  );

  return (
    <div className="flex h-full w-full">
      {/* Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            style: { stroke: "#C48C56", strokeWidth: 1.5, opacity: 0.3 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2C2824" style={{ opacity: 0.06 }} />
          <Controls
            className="!bg-white/80 !backdrop-blur-xl !border-black/5 !rounded-xl !shadow-lg"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-white/80 !backdrop-blur-xl !border-black/5 !rounded-xl !shadow-lg"
            nodeColor={(n) => {
              switch (n.type) {
                case "aiResponse": return "#C48C56";
                case "chart": return "#6B8E6B";
                case "widget": return "#7986CB";
                case "image": return "#7B9EA8";
                case "webLink": return "#9B7BA8";
                case "text": return "#8B8B6B";
                default: return "#C48C56";
              }
            }}
            maskColor="rgba(44, 40, 36, 0.05)"
          />

          {/* Top-left toolbar panel */}
          <Panel position="top-left">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-xl border border-black/5 shadow-lg px-3 py-2">
              <button
                onClick={() => addNode("text", { content: "New note...", editable: true, color: "#FFF9C4" })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2C2824]/60 hover:bg-black/5 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" />
                </svg>
                Note
              </button>
              <div className="w-px h-4 bg-black/10" />
              <button
                onClick={() => addNode("chart", { title: "New Chart", chartType: "bar", chartData: { items: [{ label: "A", value: 30 }, { label: "B", value: 50 }, { label: "C", value: 40 }], keys: ["value"], indexBy: "label" } })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2C2824]/60 hover:bg-black/5 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Chart
              </button>
              <div className="w-px h-4 bg-black/10" />
              <button
                onClick={() => addNode("widget", { widgetType: "tasks", title: "Tasks", items: [] })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2C2824]/60 hover:bg-black/5 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Widget
              </button>
              <div className="w-px h-4 bg-black/10" />
              <button
                onClick={() => addNode("group", { label: "New Group", width: 400, height: 300 })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2C2824]/60 hover:bg-black/5 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
                </svg>
                Group
              </button>
            </div>
          </Panel>

          {/* Toggle sidebar button */}
          <Panel position="top-right">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-xl border border-black/5 shadow-lg px-3 py-2 text-xs font-medium text-[#2C2824]/60 hover:text-[#C48C56] transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              AI Assistant
              {!sidebarOpen && (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* AI Sidebar */}
      {sidebarOpen && (
        <div className="w-[340px] flex-shrink-0 h-full">
          <AISidebar
            messages={sidebarMessages}
            isProcessing={isProcessing}
            onSendMessage={handleSendMessage}
            onAddNode={addNode}
          />
        </div>
      )}
    </div>
  );
}
