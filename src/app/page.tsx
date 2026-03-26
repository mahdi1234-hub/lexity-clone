"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const cardsRef = useRef<NodeListOf<Element> | null>(null);

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

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
            onClick={() => signIn("google")}
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

      {/* Footer */}
      <footer className="bg-[#2C2824] text-[#F2EFEA] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p
            className="text-sm opacity-70 font-light tracking-wide"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Made With Love By Louati Mahdi
          </p>
        </div>
      </footer>
    </div>
  );
}
