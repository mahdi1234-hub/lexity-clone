"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConversation } from "@11labs/react";

interface VoiceAgentProps {
  onClose: () => void;
}

export default function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [volumeLevel, setVolumeLevel] = useState(0);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      setAgentStatus("listening");
    },
    onDisconnect: () => {
      setIsConnected(false);
      setAgentStatus("idle");
    },
    onMessage: (message: { source: string; message: string }) => {
      setTranscript((prev) => [
        ...prev,
        { role: message.source === "user" ? "user" : "assistant", text: message.message },
      ]);
    },
    onModeChange: (mode: { mode: string }) => {
      if (mode.mode === "speaking") {
        setAgentStatus("speaking");
        setIsSpeaking(true);
      } else if (mode.mode === "listening") {
        setAgentStatus("listening");
        setIsSpeaking(false);
      } else {
        setAgentStatus("thinking");
        setIsSpeaking(false);
      }
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: "agent_0201kmwp5fvveacamafpg95ck3gd",
      });
    } catch (error) {
      console.error("Failed to start voice conversation:", error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to stop voice conversation:", error);
    }
  }, [conversation]);

  // Audio visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = 12;
    const rows = 8;
    const dotSize = 4;
    const gap = 14;
    const startX = (canvas.width - (cols - 1) * gap) / 2;
    const startY = (canvas.height - (rows - 1) * gap) / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.003;
      const intensity = isConnected ? (isSpeaking ? 1 : 0.3) : 0.1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * gap;
          const y = startY + row * gap;

          // Wave pattern
          const dist = Math.sqrt(
            Math.pow(col - cols / 2, 2) + Math.pow(row - rows / 2, 2)
          );
          const wave = Math.sin(time + dist * 0.5) * 0.5 + 0.5;
          const pulse = Math.sin(time * 2 + col * 0.3 + row * 0.2) * 0.5 + 0.5;

          const alpha = 0.2 + wave * pulse * intensity * 0.8;
          const size = dotSize * (0.5 + wave * intensity * 0.5);

          // Color gradient: cyan to blue
          const r = Math.floor(0 + pulse * 40);
          const g = Math.floor(180 + wave * 75);
          const b = Math.floor(220 + pulse * 35);

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isConnected, isSpeaking]);

  // Volume tracking from conversation status
  useEffect(() => {
    if (conversation.isSpeaking) {
      setVolumeLevel(0.7 + Math.random() * 0.3);
    } else {
      setVolumeLevel(0.1 + Math.random() * 0.2);
    }
  }, [conversation.isSpeaking]);

  const handleClose = useCallback(() => {
    if (isConnected) {
      stopConversation();
    }
    onClose();
  }, [isConnected, stopConversation, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/46011e44-1f9d-4c5e-b716-300b8ce1381e_3840w.jpg"
          alt="Voice Agent Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-white/30"
            }`}
          />
          <span
            className="text-white/60 text-xs uppercase tracking-widest"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isConnected ? "Voice Active" : "Voice Agent"}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Audio visualizer */}
        <div className="relative mb-12">
          <div className="w-48 h-48 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={200}
              height={160}
              className="w-full h-full"
            />
          </div>

          {/* Status ring */}
          <div
            className={`absolute -inset-1 rounded-3xl border-2 transition-colors duration-500 ${
              agentStatus === "speaking"
                ? "border-cyan-400/50"
                : agentStatus === "listening"
                ? "border-emerald-400/30"
                : agentStatus === "thinking"
                ? "border-amber-400/30"
                : "border-white/10"
            }`}
          />
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <p
            className="text-white text-lg font-light mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {agentStatus === "speaking"
              ? "Speaking..."
              : agentStatus === "listening"
              ? "Listening..."
              : agentStatus === "thinking"
              ? "Processing..."
              : "Ready to talk"}
          </p>
          <p className="text-white/40 text-xs">
            {isConnected
              ? "Say something to interact with the AI agent"
              : "Click the microphone to start a conversation"}
          </p>
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="w-full max-w-lg max-h-48 overflow-y-auto mb-8 scrollbar-thin">
            <div className="space-y-3 px-4">
              {transcript.slice(-6).map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-white/15 text-white/90"
                        : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-50/90"
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 pb-12 pt-4">
        <div className="flex items-center justify-center gap-6">
          {/* Mic button */}
          <button
            onClick={isConnected ? stopConversation : startConversation}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? "bg-white text-black hover:bg-white/90 scale-110"
                : "bg-white/15 text-white border border-white/20 hover:bg-white/25"
            }`}
          >
            {/* Pulse ring when active */}
            {isConnected && (
              <>
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                <span className="absolute -inset-2 rounded-full border border-white/10 animate-pulse" />
              </>
            )}
            <svg
              className="w-6 h-6 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isConnected ? (
                // Stop icon
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
              ) : (
                // Mic icon
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </>
              )}
            </svg>
          </button>

          {/* Chevron / expand button */}
          <button
            className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/70 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            title="End session"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
