"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const LexityBookViewer = dynamic(() => import("@/components/LexityBookViewer"), { ssr: false });
const AIAgentPredictorBook = dynamic(() => import("@/components/AIAgentPredictorBook"), { ssr: false });
import WelcomeModal from "@/components/WelcomeModal";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendGuideMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/product-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sign in with Google to explore our full AI platform!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".card-flashlight");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        (card as HTMLElement).style.setProperty(
          "--mouse-x",
          `${e.clientX - rect.left}px`
        );
        (card as HTMLElement).style.setProperty(
          "--mouse-y",
          `${e.clientY - rect.top}px`
        );
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  return (
    <div className="relative min-h-screen">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Hero Section with Background Image */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center group">
        <div className="absolute inset-0 bg-black/30 z-10 transition-colors group-hover:bg-black/20"></div>
        <img
          src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/b9fef1af-7076-41f8-94ac-87cf3a20563d_3840w.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
        />
        <div className="relative z-20 text-center text-white max-w-3xl px-6">
          <h1
            className="text-5xl md:text-7xl tracking-tight mb-6 leading-tight drop-shadow-lg font-light"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Your Intelligent
            <br />
            Conversation Partner
          </h1>
          <div className="flex items-center justify-center gap-3 text-lg opacity-90 drop-shadow-md mb-12">
            <div className="w-8 h-[1px] bg-white/60"></div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="font-light">
              Memory-powered AI that remembers every conversation.
            </p>
            <div className="w-8 h-[1px] bg-white/60"></div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
            className="card-flashlight inline-flex items-center gap-3 bg-white/20 backdrop-blur-xl text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 hover:bg-white/30 border border-white/20 cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Product Guide Chat Bar */}
          <div className="mt-10 w-full max-w-xl mx-auto">
            {chatOpen && chatMessages.length > 0 && (
              <div className="mb-3 max-h-48 overflow-y-auto rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 p-3 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm px-3 py-2 rounded-xl ${
                      msg.role === "user"
                        ? "bg-white/15 text-white ml-8"
                        : "bg-[#C48C56]/20 text-white/90 mr-8"
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-1.5 px-3 py-2 mr-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xl rounded-full border border-white/20 px-4 py-2">
              <svg className="w-4 h-4 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => { setChatInput(e.target.value); if (!chatOpen) setChatOpen(true); }}
                onKeyDown={(e) => { if (e.key === "Enter") sendGuideMessage(); }}
                onFocus={() => setChatOpen(true)}
                placeholder="Ask me anything about the platform..."
                className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button
                onClick={sendGuideMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-[#F2EFEA]">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
            <h2
              className="text-5xl md:text-6xl tracking-tighter font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              The Intelligence
              <br />
              of Memory
            </h2>
            <div className="relative inline-flex text-[#C48C56]">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <div className="sonar-ring"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-flashlight p-8 cursor-pointer group">
              <div className="relative z-10">
                <p
                  className="opacity-50 text-xs mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  01
                </p>
                <h3
                  className="text-2xl font-light mb-4 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Persistent Memory
                </h3>
                <p
                  className="opacity-70 leading-relaxed font-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Every conversation is remembered. Your AI assistant builds context
                  over time, creating a seamless experience that evolves with you.
                </p>
              </div>
            </div>

            <div className="card-flashlight p-8 cursor-pointer group">
              <div className="relative z-10">
                <p
                  className="opacity-50 text-xs mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  02
                </p>
                <h3
                  className="text-2xl font-light mb-4 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Private & Secure
                </h3>
                <p
                  className="opacity-70 leading-relaxed font-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Your data is isolated and protected. Each user has their own
                  private memory space, ensuring complete privacy and security.
                </p>
              </div>
            </div>

            <div className="card-flashlight p-8 cursor-pointer group">
              <div className="relative z-10">
                <p
                  className="opacity-50 text-xs mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  03
                </p>
                <h3
                  className="text-2xl font-light mb-4 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Intelligent Context
                </h3>
                <p
                  className="opacity-70 leading-relaxed font-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Cross-conversation awareness means your assistant can reference
                  past discussions, providing richer and more relevant responses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solar Dashboard CTA Section */}
      <section className="relative border-b border-[#d9d1c5] bg-[#f5f1ea] overflow-hidden">
        {/* subtle atmospheric wash */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at top left, rgba(47,93,80,0.05), transparent 28%), radial-gradient(circle at bottom right, rgba(24,21,18,0.03), transparent 26%)",
            }}
          ></div>
        </div>

        <div className="relative max-w-[1380px] mx-auto grid lg:grid-cols-[0.34fr_1fr]">
          {/* Left Rail */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#d9d1c5] px-6 sm:px-8 lg:px-10 py-12 lg:py-16">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2F5D50]"></span>
                Solar Dashboard
              </div>

              <p className="max-w-[14rem] text-[13px] leading-7 text-[#7a7268] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your window into Tunisia's fastest-growing energy sector. Live pricing, regional insights, and market trends — updated every second.
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div className="px-6 sm:px-8 lg:px-14 py-14 sm:py-16 lg:py-20">
            <div className="max-w-[980px]">
              <h2
                className="tracking-[-0.04em] leading-[1.04] text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] lg:text-[4.2rem] text-[#181512]"
                style={{ fontFamily: "'Instrument Serif', 'Plus Jakarta Sans', serif" }}
              >
                Explore the market that <span className="italic text-[#2F5D50]">powers</span> Tunisia&apos;s solar future — live data, AI insights, and real-time analytics.
              </h2>

              <div className="mt-10 lg:mt-12 grid md:grid-cols-[1fr_0.9fr] gap-10 lg:gap-14 items-start pt-8 border-t border-[#d9d1c5]">
                {/* Copy */}
                <div className="space-y-6">
                  <p className="text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Stay ahead of the competition with live solar panel pricing across 9 Tunisian regions. Monitor supplier trends, compare models, and discover emerging opportunities before anyone else.
                  </p>

                  <p className="text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Get instant access to AI-curated market intelligence, customer sentiment analysis, and pricing alerts — all updating in real time so you never miss a market shift.
                  </p>

                  {/* small markers */}
                  <div className="pt-4 grid sm:grid-cols-3 gap-5">
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>01</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live market data</p>
                    </div>
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>02</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI-powered insights</p>
                    </div>
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>03</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Interactive dashboards</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <a
                      href="/solar-dashboard"
                      className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:bg-[#2F5D50] cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Explore Solar Dashboard
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Image Block */}
                <div className="group relative">
                  <div className="relative overflow-hidden bg-[#ebe5dc] min-h-[420px] lg:min-h-[500px]">
                    <img
                      src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80"
                      alt="Solar panels in Tunisia"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    />
                    {/* inner frame */}
                    <div className="absolute inset-5 sm:inset-6 border border-[rgba(255,255,255,0.55)] transition-all duration-500 group-hover:border-[rgba(255,255,255,0.78)]"></div>
                    {/* lower plaque */}
                    <div className="absolute left-5 right-5 bottom-5 sm:left-6 sm:right-6 sm:bottom-6">
                      <div className="border border-white/45 bg-[rgba(243,239,232,0.78)] backdrop-blur-md px-4 py-4 shadow-[0_14px_36px_rgba(23,18,14,0.10)] transition-all duration-500 group-hover:bg-[rgba(243,239,232,0.88)] group-hover:shadow-[0_18px_42px_rgba(23,18,14,0.14)]">
                        <p
                          className="text-[10px] uppercase tracking-[0.14em] text-[#7d7469] mb-2 group-hover:text-[#2F5D50] transition-colors duration-300"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          Real-Time Intelligence
                        </p>
                        <p
                          className="text-[1.35rem] leading-[1.05] tracking-[-0.03em] text-[#181512]"
                          style={{ fontFamily: "'Instrument Serif', 'Plus Jakarta Sans', serif" }}
                        >
                          13 panel models, 9 regions, streaming every 10ms
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agent Predictor CTA Section */}
      <section className="relative border-b border-[#d9d1c5] bg-[#F2EFEA] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at top right, rgba(47,93,80,0.06), transparent 30%), radial-gradient(circle at bottom left, rgba(196,140,86,0.04), transparent 26%)",
            }}
          ></div>
        </div>

        <div className="relative max-w-[1380px] mx-auto grid lg:grid-cols-[0.34fr_1fr]">
          {/* Left Rail */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#d9d1c5] px-6 sm:px-8 lg:px-10 py-12 lg:py-16">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2F5D50]"></span>
                AI Agent Predictor
              </div>

              <p className="max-w-[14rem] text-[13px] leading-7 text-[#7a7268] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                A causal decision-making engine that walks you through structured analysis and delivers actionable insights.
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div className="px-6 sm:px-8 lg:px-14 py-14 sm:py-16 lg:py-20">
            <div className="max-w-[980px]">
              <h2
                className="tracking-[-0.04em] leading-[1.04] text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] lg:text-[4.2rem] text-[#181512]"
                style={{ fontFamily: "'Instrument Serif', 'Plus Jakarta Sans', serif" }}
              >
                Make decisions with <span className="italic text-[#2F5D50]">causal clarity</span> &mdash; guided by an AI that understands context.
              </h2>

              <div className="mt-10 lg:mt-12 grid md:grid-cols-[1fr_0.9fr] gap-10 lg:gap-14 items-start pt-8 border-t border-[#d9d1c5]">
                <div className="space-y-6">
                  <p className="text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Stop guessing. The AI Agent Predictor uses a structured multi-step process to map causal relationships, score your options, and surface insights you might have missed.
                  </p>

                  <p className="text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    From strategic pivots to operational trade-offs, the engine adapts to your context with conditional logic branching &mdash; asking deeper questions when the situation demands it.
                  </p>

                  <div className="pt-4 grid sm:grid-cols-3 gap-5">
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>01</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Causal analysis</p>
                    </div>
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>02</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Option scoring</p>
                    </div>
                    <div className="border-t border-[#d9d1c5] pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>03</p>
                      <p className="text-[13px] leading-6 text-[#1f1b18]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Adaptive guidance</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <a
                      href="#ai-predictor"
                      className="inline-flex items-center gap-3 bg-[#2F5D50] text-[#F2EFEA] px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:bg-[#264a40] cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 21h4" strokeLinecap="round" />
                      </svg>
                      Try AI Agent Predictor
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="group relative">
                  <div className="relative overflow-hidden bg-[#181512] min-h-[420px] lg:min-h-[500px] rounded-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2F5D50]/30 via-[#181512] to-[#181512]" />
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <svg className="w-16 h-16 text-[#2F5D50] mb-6 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                      </svg>
                      <p className="text-[1.8rem] leading-[1] tracking-[-0.03em] text-[#F2EFEA] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                        6 Steps to
                        <br />
                        <span className="italic text-[#2F5D50]">Clarity</span>
                      </p>
                      <p className="text-[13px] text-[#F2EFEA]/40 font-light max-w-[20ch]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        A structured flipbook experience for professional decision-making.
                      </p>
                    </div>
                    <div className="absolute inset-5 sm:inset-6 border border-[rgba(255,255,255,0.08)] transition-all duration-500 group-hover:border-[rgba(255,255,255,0.15)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Guide Book Viewer */}
      <LexityBookViewer />

      {/* AI Agent Predictor Flipbook */}
      <AIAgentPredictorBook />

      {/* Footer */}
      <footer className="bg-[#2C2824] text-[#F2EFEA] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <p
              className="text-sm opacity-70 font-light tracking-wide"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Made With Love By Louati Mahdi
            </p>
            <a
              href="/help-center"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#C48C56] hover:text-[#F2EFEA] transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Help Center
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
