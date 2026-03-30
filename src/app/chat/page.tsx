"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import type { FormSchema, FormSubmissionData } from "@/types/form-schema";
import type { DiagramData } from "@/components/DiagramRenderer";
import type { BrandedPDFData } from "@/components/BrandedPDFViewer";
import WebSearchResults from "@/components/WebSearchResults";

const EDADashboard = dynamic(() => import("@/components/EDADashboard"), { ssr: false });
const GraphVisualization = dynamic(() => import("@/components/GraphVisualization"), { ssr: false });
const DynamicFormRenderer = dynamic(() => import("@/components/DynamicFormRenderer"), { ssr: false });
const AutoMLDashboard = dynamic(() => import("@/components/AutoMLDashboard"), { ssr: false });
const DeckGLMap = dynamic(() => import("@/components/DeckGLMap"), { ssr: false });
const KeplerMapWrapper = dynamic(() => import("@/components/KeplerMapWrapper"), { ssr: false });
const SolarAnalytics = dynamic(() => import("@/components/SolarAnalytics"), { ssr: false });
const SiteAnalytics = dynamic(() => import("@/components/SiteAnalytics"), { ssr: false });
const DiagramRenderer = dynamic(() => import("@/components/DiagramRenderer"), { ssr: false });
const BrowserAgent = dynamic(() => import("@/components/BrowserAgent"), { ssr: false });
const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });
const BrandedPDFViewer = dynamic(() => import("@/components/BrandedPDFViewer"), { ssr: false });
const CosmographAnalytics = dynamic(() => import("@/components/CosmographAnalytics"), { ssr: false });

interface MessageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: MessageFile[];
  timestamp: string;
  formSchemas?: FormSchema[];
  formSubmitted?: Record<string, boolean>;
}

interface Conversation {
  id: string;
  lastMessage: string;
  timestamp: string;
}

interface PendingFile {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  file: File;
  preview?: string;
}

function detectFileType(filename: string, mimeType: string): string {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "docx" || ext === "doc" || mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "docx";
  if (ext === "xlsx" || ext === "xls" || mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel") return "xlsx";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (mimeType.startsWith("video/") || ["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) return "video";
  if (mimeType.startsWith("text/") || ["txt", "csv", "json", "xml", "html", "css", "js", "ts", "md", "py", "java", "c", "cpp", "sql", "yaml", "yml", "log"].includes(ext)) return "text";
  return "unknown";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  const colors: Record<string, string> = {
    pdf: "#C48C56",
    docx: "#8B7355",
    xlsx: "#6B8E6B",
    image: "#7B9EA8",
    video: "#9B7BA8",
    text: "#8B8B6B",
    unknown: "#8B7B6B",
  };
  const color = colors[type] || colors.unknown;

  if (type === "image") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  if (type === "video") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="16" rx="2" />
        <path d="M22 8l-4 2.5v3L22 16V8z" />
      </svg>
    );
  }
  if (type === "xlsx") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h2v2H8zM12 13h2v2h-2zM8 17h2v2H8zM12 17h2v2h-2z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function FilePreviewCard({
  file,
  onRemove,
  compact,
}: {
  file: { id: string; name: string; type: string; size: number; preview?: string };
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  const bgColors: Record<string, string> = {
    pdf: "bg-[#C48C56]/10 border-[#C48C56]/20",
    docx: "bg-[#8B7355]/10 border-[#8B7355]/20",
    xlsx: "bg-[#6B8E6B]/10 border-[#6B8E6B]/20",
    image: "bg-[#7B9EA8]/10 border-[#7B9EA8]/20",
    video: "bg-[#9B7BA8]/10 border-[#9B7BA8]/20",
    text: "bg-[#8B8B6B]/10 border-[#8B8B6B]/20",
    unknown: "bg-[#8B7B6B]/10 border-[#8B7B6B]/20",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <FileIcon type={file.type} className="w-3.5 h-3.5" />
        <span className="truncate max-w-[120px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {file.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-sm ${bgColors[file.type] || bgColors.unknown}`}>
      {file.type === "image" && file.preview ? (
        <img src={file.preview} alt={file.name} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/40">
          <FileIcon type={file.type} className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate opacity-80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {file.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] uppercase tracking-wider opacity-50 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {file.type}
          </span>
          <span className="text-[10px] opacity-40">&middot;</span>
          <span className="text-[10px] opacity-40" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(file.id)}
          className="absolute -right-1.5 -top-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#2C2824]/60 text-[#F2EFEA] hover:bg-[#2C2824]/80 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function TypewriterTitle() {
  const fullText = "Welcome To Lexity !";
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayed(fullText.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-0.5">
      <span>Welcome To </span>
      <span className="text-[#C48C56] italic">{displayed.replace("Welcome To ", "").replace(" !", "")}</span>
      {displayed.includes("!") && <span> !</span>}
      {!done && (
        <span className="inline-block w-[2px] h-[1.1em] bg-[#C48C56] ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edaDashboardData, setEdaDashboardData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [graphData, setGraphData] = useState<any>(null);
  const [edaLoading, setEdaLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [lastCsvFile, setLastCsvFile] = useState<File | null>(null);
  const [showCsvBanner, setShowCsvBanner] = useState(false);
  const [submittedForms, setSubmittedForms] = useState<Record<string, boolean>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [automlUploadResult, setAutomlUploadResult] = useState<any>(null);
  const [automlSessionId, setAutomlSessionId] = useState<string>("");
  const [automlLoading, setAutomlLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoVisualizations, setGeoVisualizations] = useState<any[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  // Cosmograph graph analytics state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cosmographData, setCosmographData] = useState<any>(null);
  const [cosmographLoading, setCosmographLoading] = useState(false);
  // Web search state
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [webSearchSources, setWebSearchSources] = useState<{url:string;title:string;description?:string;content?:string;markdown?:string;favicon?:string;image?:string;siteName?:string}[]>([]);
  const [webSearchNews, setWebSearchNews] = useState<{url:string;title:string;description?:string;publishedDate?:string;source?:string;image?:string}[]>([]);
  const [webSearchImages, setWebSearchImages] = useState<{url:string;title:string;thumbnail?:string;source?:string}[]>([]);
  const [webSearchAnswer, setWebSearchAnswer] = useState("");
  const [webSearchFollowUps, setWebSearchFollowUps] = useState<string[]>([]);
  const [webSearchStatus, setWebSearchStatus] = useState("");
  const [webSearchStreaming, setWebSearchStreaming] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  // Rate limiting removed - no daily limits
  // Browser agent state
  const [showBrowserAgent, setShowBrowserAgent] = useState(false);
  // Voice agent state
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".card-flashlight");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        (card as HTMLElement).style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        (card as HTMLElement).style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const loadConversation = async (convId: string) => {
    setCurrentConversationId(convId);
    try {
      const res = await fetch("/api/conversations/" + convId);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const startNewConversation = () => {
    const newId = uuidv4();
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const deleteConv = async (convId: string) => {
    try {
      await fetch("/api/conversations/" + convId, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        startNewConversation();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: PendingFile[] = selectedFiles.map((file) => {
      const fileType = detectFileType(file.name, file.type);
      const pendingFile: PendingFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        file,
      };
      if (fileType === "image") {
        pendingFile.preview = URL.createObjectURL(file);
      }
      return pendingFile;
    });
    setPendingFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = uuidv4();
      setCurrentConversationId(convId);
    }

    const userFiles: MessageFile[] = pendingFiles.map((pf) => ({
      id: pf.id,
      name: pf.name,
      type: pf.type,
      size: pf.size,
      preview: pf.preview,
    }));

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      files: userFiles.length > 0 ? userFiles : undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = pendingFiles.map((pf) => pf.file);
    setInput("");
    setPendingFiles([]);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const formData = new FormData();
      formData.append("message", currentInput.trim());
      formData.append("conversationId", convId);
      for (const file of currentFiles) {
        formData.append("files", file);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

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
                assistantMessage.content += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantMessage.content }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: PendingFile[] = droppedFiles.map((file) => {
      const fileType = detectFileType(file.name, file.type);
      const pendingFile: PendingFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        file,
      };
      if (fileType === "image") {
        pendingFile.preview = URL.createObjectURL(file);
      }
      return pendingFile;
    });
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Parse :::form, :::diagram, and :::pdf blocks from AI response content
  const parseMessageContent = useCallback((content: string): { textParts: string[]; formSchemas: FormSchema[]; diagrams: DiagramData[]; pdfDocuments: BrandedPDFData[] } => {
    const formSchemas: FormSchema[] = [];
    const diagrams: DiagramData[] = [];
    const pdfDocuments: BrandedPDFData[] = [];
    const textParts: string[] = [];
    // Match :::form, :::diagram, and :::pdf blocks
    const blockRegex = /:::(form|diagram|pdf)\s*([\s\S]*?):::/g;
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index).trim();
      if (before) textParts.push(before);
      const blockType = match[1];
      const blockContent = match[2].trim();
      try {
        const parsed = JSON.parse(blockContent);
        if (blockType === "form") {
          formSchemas.push(parsed as FormSchema);
        } else if (blockType === "diagram") {
          diagrams.push(parsed as DiagramData);
        } else if (blockType === "pdf") {
          pdfDocuments.push(parsed as BrandedPDFData);
        }
      } catch {
        textParts.push(match[0]);
      }
      lastIndex = match.index + match[0].length;
    }

    const after = content.slice(lastIndex).trim();
    if (after) textParts.push(after);
    if (textParts.length === 0 && formSchemas.length === 0 && diagrams.length === 0 && pdfDocuments.length === 0) textParts.push(content);

    return { textParts, formSchemas, diagrams, pdfDocuments };
  }, []);

  // Handle form submission - send data back to AI as context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFormSubmit = useCallback(async (data: FormSubmissionData, _messageId: string) => {
    setSubmittedForms((prev) => ({ ...prev, [data.formId]: true }));

    // Format submission data as a user message
    const formattedValues = Object.entries(data.values)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(", ");

    const submissionMessage = `[Form Submitted: ${data.formTitle}] ${formattedValues}`;

    // Send the form data as a new message to the AI
    let convId = currentConversationId;
    if (!convId) {
      convId = uuidv4();
      setCurrentConversationId(convId);
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: submissionMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", submissionMessage);
      formData.append("conversationId", convId);

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send form data");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const lineData = line.slice(6);
            if (lineData === "[DONE]") break;
            try {
              const parsed = JSON.parse(lineData);
              if (parsed.content) {
                assistantMessage.content += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantMessage.content }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      fetchConversations();
    } catch (error) {
      console.error("Error sending form data:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "I received your form submission but encountered an error processing it. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  // Detect CSV files in pending uploads
  useEffect(() => {
    const csvFile = pendingFiles.find((f) => {
      const ext = f.name.toLowerCase().split(".").pop();
      return ext === "csv" || ext === "tsv";
    });
    if (csvFile) {
      setLastCsvFile(csvFile.file);
      setShowCsvBanner(true);
    } else {
      setShowCsvBanner(false);
    }
  }, [pendingFiles]);

  const triggerEDA = async () => {
    if (!lastCsvFile || edaLoading) return;
    setEdaLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", lastCsvFile);
      const res = await fetch("/api/eda", { method: "POST", body: formData });
      if (!res.ok) throw new Error("EDA analysis failed");
      const data = await res.json();
      setEdaDashboardData(data.dashboard || data);
    } catch (error) {
      console.error("EDA error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Failed to generate EDA dashboard. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setEdaLoading(false);
    }
  };

  const triggerAutoML = async () => {
    if (!lastCsvFile || automlLoading) return;
    setAutomlLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", lastCsvFile);
      const res = await fetch("/api/automl", { method: "POST", body: formData, headers: {} });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "AutoML upload failed");
      }
      const data = await res.json();
      setAutomlSessionId(data.session_id);
      setAutomlUploadResult(data);
    } catch (error) {
      console.error("AutoML error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Failed to initialize AutoML. Make sure the PyCaret backend is running (python pycaret-backend/main.py).",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setAutomlLoading(false);
    }
  };

  const triggerCosmograph = async () => {
    if (!lastCsvFile || cosmographLoading) return;
    setCosmographLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", lastCsvFile);
      const res = await fetch("/api/graph-analytics", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Graph analytics failed");
      const data = await res.json();
      setCosmographData(data);
    } catch (error) {
      console.error("Cosmograph analytics error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Failed to generate graph network analytics. Please try again with a valid CSV file.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setCosmographLoading(false);
    }
  };

  const triggerGraph = async () => {
    if (graphLoading) return;
    setGraphLoading(true);
    try {
      const conversationHistory = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")
        .slice(-3000);
      const res = await fetch("/api/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Generate a knowledge graph from this conversation",
          conversationHistory,
        }),
      });
      if (!res.ok) throw new Error("Graph generation failed");
      const data = await res.json();
      setGraphData(data.graph);
    } catch (error) {
      console.error("Graph error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Failed to generate graph visualization. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setGraphLoading(false);
    }
  };

  // Web search trigger
  const triggerWebSearch = async (query: string) => {
    if (!query.trim() || webSearchStreaming) return;
    setWebSearchActive(true);
    setWebSearchSources([]);
    setWebSearchNews([]);
    setWebSearchImages([]);
    setWebSearchAnswer("");
    setWebSearchFollowUps([]);
    setWebSearchStatus("Searching the web...");
    setWebSearchStreaming(true);
    setWebSearchQuery(query);

    try {
      const conversationHistory = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, conversationHistory }),
      });

      if (!res.ok) throw new Error("Web search failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const { event, data } = parsed;
            if (event === "status") setWebSearchStatus(data.message);
            else if (event === "sources") {
              setWebSearchSources(data.sources || []);
              setWebSearchNews(data.newsResults || []);
              setWebSearchImages(data.imageResults || []);
            }
            else if (event === "content") setWebSearchAnswer((prev) => prev + data.content);
            else if (event === "followup") setWebSearchFollowUps(data.questions || []);
            else if (event === "error") {
              setWebSearchStatus("Error: " + data.message);
              setWebSearchStreaming(false);
            }
            else if (event === "done") setWebSearchStreaming(false);
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (error) {
      console.error("Web search error:", error);
      setWebSearchStatus("Search failed. Please try again.");
    } finally {
      setWebSearchStreaming(false);
    }
  };

  const handleWebSearchFollowUp = useCallback((question: string) => {
    triggerWebSearch(question);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const closeWebSearch = () => {
    setWebSearchActive(false);
    setWebSearchSources([]);
    setWebSearchNews([]);
    setWebSearchImages([]);
    setWebSearchAnswer("");
    setWebSearchFollowUps([]);
    setWebSearchStatus("");
    setWebSearchStreaming(false);
    setWebSearchQuery("");
  };

  // Geospatial / Solar / Site analytics trigger
  const triggerGeospatial = async (query: string) => {
    if (geoLoading) return;
    setGeoLoading(true);
    try {
      const conversationContext = messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const res = await fetch("/api/geospatial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, conversationContext }),
      });
      if (!res.ok) throw new Error("Geospatial analysis failed");
      const data = await res.json();
      setGeoVisualizations((prev) => [...prev, { id: uuidv4(), ...data }]);
    } catch (error) {
      console.error("Geospatial error:", error);
    } finally {
      setGeoLoading(false);
    }
  };

  // Auto-detect geospatial/solar queries from AI responses
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || !lastMsg.content) return;
    const content = lastMsg.content;
    // Detect geo/solar/map trigger tags from AI
    const geoMatch = content.match(/:::geo(?:spatial)?\s*([\s\S]*?):::/i);
    if (geoMatch) {
      try {
        const geoConfig = JSON.parse(geoMatch[1].trim());
        setGeoVisualizations((prev) => [...prev, { id: uuidv4(), ...geoConfig }]);
      } catch {
        // Try treating it as a query
        triggerGeospatial(geoMatch[1].trim());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <div className="relative inline-flex text-[#C48C56]">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/b9fef1af-7076-41f8-94ac-87cf3a20563d_3840w.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#F2EFEA]/85 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div
          className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
          <div className="w-72 h-full flex flex-col bg-white/30 backdrop-blur-xl border-r border-black/5">
            <div className="p-4 border-b border-black/5">
              <button
                onClick={startNewConversation}
                className="w-full card-flashlight flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="relative z-10">New Conversation</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all text-sm ${
                    currentConversationId === conv.id
                      ? "bg-white/60 backdrop-blur-sm"
                      : "hover:bg-white/30"
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <svg className="w-4 h-4 opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span
                    className="flex-1 truncate opacity-80"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {conv.lastMessage.replace("...", "")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConv(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p
                  className="text-center text-sm opacity-40 mt-8 font-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  No conversations yet
                </p>
              )}
            </div>

            {/* Workflows Button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => router.push("/workflows")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#C48C56]/10 text-[#C48C56] hover:bg-[#C48C56]/20 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
                </svg>
                Geo Workflows
              </button>
            </div>

            {/* Collaborate Button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => router.push("/collaborate")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#7986CB]/10 text-[#7986CB] hover:bg-[#7986CB]/20 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Collaborate
              </button>
            </div>

            {/* Reports Button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => router.push("/reports")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#9B7BA8]/10 text-[#9B7BA8] hover:bg-[#9B7BA8]/20 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8M16 17H8" strokeLinecap="round" />
                </svg>
                My Reports
              </button>
            </div>

            {/* Dashboard Button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#6B8E6B]/10 text-[#6B8E6B] hover:bg-[#6B8E6B]/20 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </button>
            </div>

            {/* Browser Agent Button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => setShowBrowserAgent(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#C48C56]/10 to-[#8B6B3D]/10 text-[#C48C56] hover:from-[#C48C56]/20 hover:to-[#8B6B3D]/20 transition-all border border-[#C48C56]/10"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                Browser Agent
                <span className="ml-auto text-[9px] opacity-50">1/day</span>
              </button>
            </div>



            <div className="p-4 border-t border-black/5">
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {session.user?.name}
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-xl border-b border-black/5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <h1
              className="text-lg font-light tracking-tight opacity-80"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <TypewriterTitle />
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                  <div className="relative inline-flex text-[#C48C56] mb-6">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <div className="sonar-ring"></div>
                  </div>
                  <h2
                    className="text-3xl font-light tracking-tight mb-3 opacity-80"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    How can I help you today?
                  </h2>
                  <p
                    className="text-sm opacity-50 font-light max-w-md"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Start a conversation and I will remember everything we discuss. Upload any file and I will analyze it for you.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mt-8">
                    {[
                      { type: "pdf", label: "PDF Documents" },
                      { type: "docx", label: "Word & Excel" },
                      { type: "image", label: "Images" },
                      { type: "video", label: "Videos" },
                    ].map((item) => (
                      <div key={item.type} className="card-flashlight p-3 text-center cursor-default">
                        <div className="relative z-10">
                          <div className="flex justify-center mb-2">
                            <FileIcon type={item.type} className="w-6 h-6" />
                          </div>
                          <p
                            className="text-xs opacity-60 font-light"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const { textParts, formSchemas: parsedForms, diagrams: parsedDiagrams, pdfDocuments: parsedPDFs } = parseMessageContent(message.content);
                return (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.role === "user"
                            ? "card-flashlight bg-[#2C2824]/90 text-[#F2EFEA] p-4 rounded-2xl rounded-br-md"
                            : "card-flashlight bg-white/60 backdrop-blur-sm p-4 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        {/* File attachments on user messages */}
                        {message.files && message.files.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {message.files.map((file) => (
                              <FilePreviewCard key={file.id} file={file} compact />
                            ))}
                          </div>
                        )}
                        <p
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {textParts.join("\n")}
                          {message.role === "assistant" && isLoading && message.id === messages[messages.length - 1]?.id && !message.content && (
                            <span className="inline-flex gap-1 ml-1">
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Render inline forms from AI response */}
                    {message.role === "assistant" && parsedForms.length > 0 && parsedForms.map((formSchema) => (
                      <div key={formSchema.id} className="flex justify-start mt-3">
                        {submittedForms[formSchema.id] ? (
                          <div className="w-full max-w-[95%] card-flashlight bg-white/70 backdrop-blur-xl rounded-2xl border border-[#C48C56]/20 p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#C48C56]/20 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <p className="text-sm opacity-70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <span className="font-medium">{formSchema.title}</span> submitted successfully
                              </p>
                            </div>
                          </div>
                        ) : (
                          <DynamicFormRenderer
                            schema={formSchema}
                            onSubmit={(data) => handleFormSubmit(data, message.id)}
                          />
                        )}
                      </div>
                    ))}

                    {/* Render inline diagrams from AI response */}
                    {message.role === "assistant" && parsedDiagrams.length > 0 && parsedDiagrams.map((diagram, dIdx) => (
                      <div key={`diagram-${message.id}-${dIdx}`} className="flex justify-start mt-3">
                        <div className="w-full max-w-[95%]">
                          <DiagramRenderer diagram={diagram} />
                        </div>
                      </div>
                    ))}

                    {/* Render branded PDF documents from AI response */}
                    {message.role === "assistant" && parsedPDFs.length > 0 && parsedPDFs.map((pdfData, pIdx) => (
                      <div key={`pdf-${message.id}-${pIdx}`} className="flex justify-start mt-3">
                        <BrandedPDFViewer data={pdfData} />
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Web Search Results */}
              {webSearchActive && (
                <div className="flex justify-start animate-fadeUp">
                  <div className="w-full max-w-[95%] card-flashlight bg-white/60 backdrop-blur-sm p-5 rounded-2xl rounded-bl-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="text-xs font-medium text-[#2C2824]/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Web Search: {webSearchQuery}
                        </span>
                      </div>
                      <button
                        onClick={closeWebSearch}
                        className="p-1 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-40 hover:opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <WebSearchResults
                      sources={webSearchSources}
                      newsResults={webSearchNews}
                      imageResults={webSearchImages}
                      answer={webSearchAnswer}
                      followUpQuestions={webSearchFollowUps}
                      searchStatus={webSearchStatus}
                      isStreaming={webSearchStreaming}
                      onFollowUpClick={handleWebSearchFollowUp}
                    />
                  </div>
                </div>
              )}

              {/* Inline EDA Dashboard in Chat */}
              {edaDashboardData && (
                <div className="flex justify-start">
                  <div className="w-full max-w-[95%]">
                    <EDADashboard data={edaDashboardData} onClose={() => setEdaDashboardData(null)} inline={true} />
                  </div>
                </div>
              )}

              {/* Inline Geospatial / Solar / Site Visualizations */}
              {geoVisualizations.map((viz) => (
                <div key={viz.id} className="flex justify-start mt-3">
                  <div className="w-full max-w-[95%]">
                    {viz.type === "deckgl" && viz.config && (
                      <DeckGLMap config={viz.config} onClose={() => setGeoVisualizations((prev) => prev.filter((v) => v.id !== viz.id))} inline />
                    )}
                    {viz.type === "kepler" && viz.config && (
                      <KeplerMapWrapper config={viz.config} onClose={() => setGeoVisualizations((prev) => prev.filter((v) => v.id !== viz.id))} inline />
                    )}
                    {viz.type === "solar" && viz.data && (
                      <SolarAnalytics data={viz.data} onClose={() => setGeoVisualizations((prev) => prev.filter((v) => v.id !== viz.id))} inline />
                    )}
                    {viz.type === "site" && viz.data && (
                      <SiteAnalytics data={viz.data} onClose={() => setGeoVisualizations((prev) => prev.filter((v) => v.id !== viz.id))} inline />
                    )}
                  </div>
                </div>
              ))}

              {/* Geospatial loading indicator */}
              {geoLoading && (
                <div className="flex justify-start mt-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#C48C56]/20">
                    <svg className="w-4 h-4 animate-spin text-[#C48C56]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs text-[#2C2824]/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Generating visualization...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* File Previews */}
          {pendingFiles.length > 0 && (
            <div className="px-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-black/5">
                  {pendingFiles.map((file) => (
                    <FilePreviewCard
                      key={file.id}
                      file={file}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 pb-4" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            <div className="max-w-3xl mx-auto">
              <div className="card-flashlight flex items-end gap-3 p-3 bg-white/50 backdrop-blur-xl rounded-2xl">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.mp4,.webm,.avi,.mov,.mkv,.txt,.csv,.json,.xml,.html,.css,.js,.ts,.md,.py,.java,.c,.cpp,.sql,.yaml,.yml,.log"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl hover:bg-black/5 transition-all disabled:opacity-30 flex-shrink-0 group"
                  title="Upload files"
                >
                  <svg className="w-4 h-4 opacity-50 group-hover:opacity-80 transition-opacity text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingFiles.length > 0 ? "Add a message about your files..." : "Type your message..."}
                  rows={1}
                  className="flex-1 bg-transparent resize-none outline-none text-sm p-2 max-h-[200px] placeholder:opacity-40"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
                  className="p-2.5 rounded-xl bg-[#2C2824] text-[#F2EFEA] transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 flex-shrink-0"
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CSV EDA Banner */}
          {showCsvBanner && (
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 p-3 bg-[#C48C56]/10 border border-[#C48C56]/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-5 h-5 text-[#C48C56] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h2v2H8zM12 13h2v2h-2zM8 17h2v2H8zM12 17h2v2h-2z" />
                  </svg>
                  <p className="flex-1 text-xs text-[#2C2824]/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    CSV file detected!
                  </p>
                  <button
                    onClick={triggerEDA}
                    disabled={edaLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-[#C48C56] text-white rounded-lg hover:bg-[#B07A48] transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {edaLoading ? "Analyzing..." : "EDA Dashboard"}
                  </button>
                  <button
                    onClick={triggerAutoML}
                    disabled={automlLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-[#C48C56] to-[#8B6B3D] text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {automlLoading ? "Loading..." : "AutoML Pipeline"}
                  </button>
                  <button
                    onClick={triggerCosmograph}
                    disabled={cosmographLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-[#7986CB] to-[#5C6BC0] text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {cosmographLoading ? "Analyzing..." : "Graph Network"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (Web Search + Graph + Geo + Voice) */}
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
              {/* Voice Agent */}
              <button
                onClick={() => setShowVoiceAgent(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2C2824]/60 hover:text-[#C48C56] hover:bg-[#C48C56]/10 rounded-lg transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                title="Talk to AI voice agent"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Voice
              </button>
              {/* Web Search - always visible */}
              <button
                onClick={() => {
                  if (input.trim()) {
                    triggerWebSearch(input.trim());
                  } else {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                    if (lastUserMsg) triggerWebSearch(lastUserMsg.content);
                  }
                }}
                disabled={webSearchStreaming || (!input.trim() && messages.length === 0)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2C2824]/60 hover:text-[#C48C56] hover:bg-[#C48C56]/10 rounded-lg transition-all disabled:opacity-40"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                title="Search the web with AI"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {webSearchStreaming ? "Searching..." : "Web Search"}
              </button>
              {messages.length > 0 && (
                <>
                  <button
                    onClick={triggerGraph}
                    disabled={graphLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2C2824]/60 hover:text-[#C48C56] hover:bg-[#C48C56]/10 rounded-lg transition-all disabled:opacity-40"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    title="Generate knowledge graph from conversation"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
                      <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
                    </svg>
                    {graphLoading ? "Generating..." : "Graph View"}
                  </button>
                  <button
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                      if (lastUserMsg) triggerGeospatial(lastUserMsg.content);
                    }}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2C2824]/60 hover:text-[#C48C56] hover:bg-[#C48C56]/10 rounded-lg transition-all disabled:opacity-40"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    title="Generate geospatial / solar / site visualization"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {geoLoading ? "Generating..." : "Map View"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 pb-3">
            <p
              className="text-center text-xs opacity-40 font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Made With Love By Louati Mahdi
            </p>
          </div>
        </div>
      </div>

      {/* EDA Dashboard Fullscreen Overlay (accessible via double-click on inline) */}

      {/* Graph Visualization Overlay */}
      {graphData && (
        <div className="fixed inset-0 z-50 bg-[#F2EFEA]/95 backdrop-blur-sm">
          <GraphVisualization data={graphData} onClose={() => setGraphData(null)} />
        </div>
      )}

      {/* AutoML Dashboard Overlay */}
      {automlUploadResult && (
        <AutoMLDashboard
          sessionId={automlSessionId}
          uploadResult={automlUploadResult}
          onClose={() => { setAutomlUploadResult(null); setAutomlSessionId(""); }}
        />
      )}

      {/* Browser Agent Overlay */}
      {showBrowserAgent && (
        <BrowserAgent onClose={() => setShowBrowserAgent(false)} />
      )}

      {/* Voice Agent Overlay */}
      {showVoiceAgent && (
        <VoiceAgent onClose={() => setShowVoiceAgent(false)} />
      )}

      {/* Cosmograph Graph Network Analytics Overlay */}
      {cosmographData && (
        <CosmographAnalytics data={cosmographData} onClose={() => setCosmographData(null)} />
      )}
    </div>
  );
}
