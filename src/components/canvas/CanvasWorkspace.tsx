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

  // Classify user intent and generate dynamic, unique responses
  const classifyIntent = useCallback((message: string) => {
    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);

    // Chart/visualization requests
    if (/\b(chart|graph|plot|visualiz|histogram|distribution|trend|analytics|metric|kpi|dashboard)\b/.test(lower)) {
      const chartType = /\b(pie|donut|circle)\b/.test(lower) ? "pie"
        : /\b(line|trend|time.?series|growth)\b/.test(lower) ? "line"
        : /\b(radar|spider|comparison)\b/.test(lower) ? "radar"
        : "bar";
      return { type: "chart", chartType, confidence: "high" };
    }
    // Email
    if (/\b(email|inbox|mail|message|unread|gmail)\b/.test(lower)) return { type: "email", confidence: "high" };
    // Calendar
    if (/\b(calendar|schedule|event|meeting|appointment|agenda)\b/.test(lower)) return { type: "calendar", confidence: "high" };
    // Tasks
    if (/\b(task|todo|checklist|to.?do|action.?item|backlog)\b/.test(lower)) return { type: "tasks", confidence: "high" };
    // Meet/video
    if (/\b(meet|video|call|zoom|conference|huddle)\b/.test(lower)) return { type: "meet", confidence: "high" };
    // Note/write
    if (/\b(note|write|jot|memo|sticky|remind|remember)\b/.test(lower)) return { type: "note", confidence: "high" };
    // Web/link/research
    if (/\b(link|url|website|browse|search|research|find|look.?up)\b/.test(lower)) return { type: "weblink", confidence: "medium" };
    // Image
    if (/\b(image|picture|photo|screenshot|visual|illustration|diagram)\b/.test(lower)) return { type: "image", confidence: "medium" };
    // Multiple items / complex request
    if (words.length > 15) return { type: "complex", confidence: "medium" };
    // Default: AI response
    return { type: "response", confidence: "low" };
  }, []);

  // Generate unique thinking steps per intent
  type StepType = "thinking" | "tool_use" | "result" | "error";
  const generateThinkingSteps = useCallback((intent: { type: string; chartType?: string; confidence: string }, message: string) => {
    const stepSets: Record<string, { id: string; type: StepType; title: string; content: string; status: "pending" | "running"; timestamp: string }[]> = {
      chart: [
        { id: "s1", type: "thinking", title: "Interpreting data visualization request", content: `Detected chart request: "${message.slice(0, 50)}..."`, status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: `Generating ${intent.chartType || "bar"} chart data`, content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "tool_use", title: "Rendering Nivo visualization", content: "", status: "pending", timestamp: "" },
        { id: "s4", type: "result", title: "Placing chart on canvas", content: "", status: "pending", timestamp: "" },
      ],
      email: [
        { id: "s1", type: "thinking", title: "Processing email widget request", content: "Checking for email-related keywords...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Fetching email data structure", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Rendering email widget card", content: "", status: "pending", timestamp: "" },
      ],
      calendar: [
        { id: "s1", type: "thinking", title: "Understanding schedule request", content: "Parsing calendar-related intent...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Building calendar view", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Adding calendar to canvas", content: "", status: "pending", timestamp: "" },
      ],
      tasks: [
        { id: "s1", type: "thinking", title: "Parsing task/todo request", content: "Extracting actionable items...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Organizing task list", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Creating task widget", content: "", status: "pending", timestamp: "" },
      ],
      meet: [
        { id: "s1", type: "thinking", title: "Recognizing meeting request", content: "Identifying video call context...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Preparing meeting widget", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Adding meeting card to canvas", content: "", status: "pending", timestamp: "" },
      ],
      note: [
        { id: "s1", type: "thinking", title: "Processing note request", content: "Formatting text content...", status: "running", timestamp: "" },
        { id: "s2", type: "result", title: "Creating editable note card", content: "", status: "pending", timestamp: "" },
      ],
      weblink: [
        { id: "s1", type: "thinking", title: "Analyzing web/research request", content: "Identifying URL or search intent...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Extracting link metadata", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Creating link preview card", content: "", status: "pending", timestamp: "" },
      ],
      image: [
        { id: "s1", type: "thinking", title: "Processing image request", content: "Identifying visual content needs...", status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Preparing image placeholder", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Adding image card to canvas", content: "", status: "pending", timestamp: "" },
      ],
      complex: [
        { id: "s1", type: "thinking", title: "Analyzing complex request", content: "Breaking down multi-part query...", status: "running", timestamp: "" },
        { id: "s2", type: "thinking", title: "Identifying key components", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "tool_use", title: "Generating structured response", content: "", status: "pending", timestamp: "" },
        { id: "s4", type: "result", title: "Composing canvas card", content: "", status: "pending", timestamp: "" },
      ],
      response: [
        { id: "s1", type: "thinking", title: "Understanding your question", content: `Processing: "${message.slice(0, 60)}..."`, status: "running", timestamp: "" },
        { id: "s2", type: "tool_use", title: "Formulating response", content: "", status: "pending", timestamp: "" },
        { id: "s3", type: "result", title: "Adding response to canvas", content: "", status: "pending", timestamp: "" },
      ],
    };
    return stepSets[intent.type] || stepSets.response;
  }, []);

  // Generate unique chart data based on the actual prompt
  const generateChartData = useCallback((message: string, chartType: string) => {
    const hash = message.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const abs = Math.abs(hash);
    const labels = [
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      ["Q1", "Q2", "Q3", "Q4"],
      ["Mon", "Tue", "Wed", "Thu", "Fri"],
      ["Design", "Dev", "Marketing", "Sales", "Support"],
      ["North", "South", "East", "West"],
      ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
    ];
    const labelSet = labels[abs % labels.length];
    const genVal = (i: number) => 15 + ((abs * (i + 1) * 7) % 80);

    switch (chartType) {
      case "pie":
        return {
          chartData: {
            items: labelSet.slice(0, 4).map((l, i) => ({ id: l.toLowerCase(), label: l, value: genVal(i) })),
          },
        };
      case "line":
        return {
          chartData: {
            series: [{
              id: "series",
              data: labelSet.map((l, i) => ({ x: l, y: genVal(i) })),
            }],
          },
        };
      case "radar":
        return {
          chartData: {
            items: labelSet.map((l, i) => ({ label: l, value: genVal(i), benchmark: genVal(i + 3) })),
            keys: ["value", "benchmark"],
            indexBy: "label",
          },
        };
      default: // bar
        return {
          chartData: {
            items: labelSet.map((l, i) => ({ label: l, value: genVal(i) })),
            keys: ["value"],
            indexBy: "label",
          },
        };
    }
  }, []);

  // Generate unique completion messages
  const getCompletionMessage = useCallback((intent: { type: string }, message: string) => {
    const messages: Record<string, string[]> = {
      chart: [
        "Chart visualization created and placed on your canvas. You can drag it to reposition or connect it to related nodes.",
        "Data visualization ready! The chart is now on your canvas. Try connecting it to other cards for context.",
        "Your chart has been generated with dynamic data. Drag handles to create connections between nodes.",
      ],
      email: [
        "Email widget added to your workspace. It shows your latest messages at a glance.",
        "Your inbox widget is now on the canvas. Connect it to related task or calendar nodes for a unified view.",
      ],
      calendar: [
        "Calendar widget placed on canvas. Your upcoming events are displayed in a clean timeline format.",
        "Schedule overview added! Connect it to meeting or task nodes to build your daily workflow view.",
      ],
      tasks: [
        "Task list created on your canvas. Double-click items to update their status.",
        "Your to-do widget is ready. Connect it to related notes or calendar events for full context.",
      ],
      meet: [
        "Meeting widget added. It shows your upcoming video calls and their timing.",
        "Your meetings overview is on the canvas. Link it to preparation notes or agendas.",
      ],
      note: [
        "Note card created! Double-click to edit the content. Drag it near related items to keep things organized.",
        "Your note is on the canvas. You can edit it anytime by double-clicking the text area.",
      ],
      weblink: [
        "Link preview card added to your canvas. It shows the site metadata at a glance.",
        "Web reference created. Connect it to related research notes or analysis nodes.",
      ],
      image: [
        "Image card placed on canvas. You can connect it to descriptions or analysis nodes.",
        "Visual content card added. Drag it into position and create connections to related content.",
      ],
      complex: [
        `I've broken down your request and created a detailed response card. You can find it on the canvas.`,
        `Complex request processed. The structured response is now on your canvas with all the key points.`,
      ],
      response: [
        `I've analyzed "${message.slice(0, 40)}..." and added my response to the canvas. Feel free to connect it with other nodes.`,
        `Response generated and placed on your canvas. Each card can be connected to build a knowledge map.`,
        `Here's my take on that. The response card is on your canvas -- drag it where it fits best in your workflow.`,
      ],
    };
    const options = messages[intent.type] || messages.response;
    const idx = Math.abs(message.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % options.length;
    return options[idx];
  }, []);

  // Unique note colors
  const noteColors = ["#FFF9C4", "#E8F5E9", "#E3F2FD", "#FFF3E0", "#F3E5F5", "#EFEBE9", "#E0F7FA"];

  // Process AI messages with dynamic, context-aware responses
  const handleSendMessage = useCallback(
    async (message: string) => {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userMsg: SidebarMessage = { id: `msg-${Date.now()}`, role: "user", content: message, timestamp: now };
      setSidebarMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      const intent = classifyIntent(message);
      const steps = generateThinkingSteps(intent, message);
      const msgId = `msg-${Date.now()}-resp`;

      const assistantMsg: SidebarMessage = {
        id: msgId, role: "assistant", content: "", timestamp: now,
        thinkingSteps: steps.map((s, i) => ({ ...s, status: i === 0 ? "running" as const : "pending" as const })),
        isStreaming: true,
      };
      setSidebarMessages((prev) => [...prev, assistantMsg]);

      // Animate through each thinking step
      for (let i = 0; i < steps.length; i++) {
        const delay = 400 + Math.random() * 500; // varied timing
        await new Promise((r) => setTimeout(r, delay));
        setSidebarMessages((prev) =>
          prev.map((m) => {
            if (m.id !== msgId) return m;
            return {
              ...m,
              thinkingSteps: m.thinkingSteps?.map((s, j) => {
                if (j === i) return { ...s, status: "done" as const };
                if (j === i + 1) return { ...s, status: "running" as const, content: s.content || "Processing..." };
                return s;
              }),
            };
          })
        );
      }

      // Create the appropriate node(s) based on intent
      const lower = message.toLowerCase();
      switch (intent.type) {
        case "chart": {
          const ct = (intent as { chartType?: string }).chartType || "bar";
          const { chartData } = generateChartData(message, ct);
          // Extract a title from the message
          const titleWords = message.split(/\s+/).slice(0, 5).join(" ");
          addNode("chart", { title: titleWords || "Chart", chartType: ct, chartData, description: `Generated from: "${message.slice(0, 80)}"` });
          break;
        }
        case "email":
          addNode("widget", {
            widgetType: "email",
            title: lower.includes("work") ? "Work Inbox" : lower.includes("personal") ? "Personal Email" : "Email Inbox",
            items: [
              { id: `e${Date.now()}1`, title: "Project update from team lead", subtitle: "updates@team.io", time: "2m ago", status: "unread" },
              { id: `e${Date.now()}2`, title: "Weekly digest available", subtitle: "digest@company.com", time: "45m ago", status: "unread" },
              { id: `e${Date.now()}3`, title: "Feedback on latest draft", subtitle: "reviewer@org.com", time: "2h ago", status: "read" },
            ],
          });
          break;
        case "calendar":
          addNode("widget", {
            widgetType: "calendar",
            title: lower.includes("week") ? "This Week" : lower.includes("tomorrow") ? "Tomorrow" : "Today's Schedule",
            items: [
              { id: `c${Date.now()}1`, title: "Morning standup", subtitle: "9:00 AM - 9:15 AM", time: "09:00", status: "done" },
              { id: `c${Date.now()}2`, title: "Sprint planning", subtitle: "10:30 AM - 11:30 AM", time: "10:30", status: "upcoming" },
              { id: `c${Date.now()}3`, title: "Lunch with client", subtitle: "12:30 PM - 1:30 PM", time: "12:30", status: "upcoming" },
            ],
          });
          break;
        case "tasks": {
          // Try to extract actual tasks from the message
          const taskItems = message.split(/[,;\n]/).filter(t => t.trim().length > 3).map((t, i) => ({
            id: `t${Date.now()}${i}`, title: t.trim(), status: "pending" as const,
          }));
          addNode("widget", {
            widgetType: "tasks",
            title: "Task List",
            items: taskItems.length > 1 ? taskItems : [
              { id: `t${Date.now()}1`, title: message.slice(0, 60), status: "pending" },
              { id: `t${Date.now()}2`, title: "Follow up on above", status: "pending" },
            ],
          });
          break;
        }
        case "meet":
          addNode("widget", {
            widgetType: "meet",
            title: "Upcoming Calls",
            items: [
              { id: `m${Date.now()}1`, title: lower.includes("team") ? "Team sync" : "Scheduled call", subtitle: "Starting soon", time: "Next", status: "upcoming" },
              { id: `m${Date.now()}2`, title: "1:1 check-in", subtitle: "Tomorrow at 11:00 AM", time: "11:00", status: "upcoming" },
            ],
          });
          break;
        case "note": {
          const colorIdx = Math.abs(message.charCodeAt(0) + message.length) % noteColors.length;
          addNode("text", { title: message.split(/\s+/).slice(0, 4).join(" "), content: message, color: noteColors[colorIdx], editable: true });
          break;
        }
        case "weblink": {
          const urlMatch = message.match(/https?:\/\/[^\s]+/);
          addNode("webLink", {
            url: urlMatch ? urlMatch[0] : "https://example.com",
            title: urlMatch ? `Link: ${urlMatch[0].slice(0, 40)}` : message.slice(0, 50),
            description: `Referenced from your request: "${message.slice(0, 80)}"`,
          });
          break;
        }
        case "image":
          addNode("image", {
            src: `https://placehold.co/600x400/F2EFEA/C48C56?text=${encodeURIComponent(message.slice(0, 20))}`,
            alt: message.slice(0, 50),
            caption: `Image placeholder for: "${message.slice(0, 60)}"`,
            width: 300,
          });
          break;
        case "complex": {
          // For complex requests, create multiple nodes
          addNode("aiResponse", {
            content: `Analysis of your request:\n\n"${message}"\n\nThis is a multi-faceted query. I've broken it down and created this overview card. Use the sidebar to ask follow-up questions about specific aspects.`,
            model: "AI Assistant",
            timestamp: now,
            isUser: false,
          });
          // Also add a note with key points
          const colorIdx2 = Math.abs(message.length * 7) % noteColors.length;
          addNode("text", {
            title: "Key Points",
            content: message.split(/[.!?]/).filter(s => s.trim()).slice(0, 4).map((s, i) => `${i + 1}. ${s.trim()}`).join("\n") || message,
            color: noteColors[colorIdx2],
            editable: true,
          });
          break;
        }
        default:
          addNode("aiResponse", {
            content: message.length > 100
              ? `Here's my analysis:\n\n${message}\n\nI've created this response card on your canvas. You can connect it to related nodes to build context.`
              : `Regarding "${message}":\n\nI've processed your request and added this card to the canvas. Drag it into position and create connections to build your knowledge map.`,
            model: "AI Assistant",
            timestamp: now,
            isUser: false,
          });
      }

      // Final completion
      await new Promise((r) => setTimeout(r, 300));
      const completionMsg = getCompletionMessage(intent, message);
      setSidebarMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content: completionMsg, isStreaming: false, thinkingSteps: m.thinkingSteps?.map((s) => ({ ...s, status: "done" as const })) }
            : m
        )
      );
      setIsProcessing(false);
    },
    [addNode, classifyIntent, generateThinkingSteps, generateChartData, getCompletionMessage, noteColors]
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
