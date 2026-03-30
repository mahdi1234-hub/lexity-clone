"use client";

import { useState, useEffect } from "react";

export default function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show modal after a brief delay for a polished entrance
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 400);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#181512]/60 backdrop-blur-sm transition-opacity duration-500 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal card */}
      <div
        className={`relative w-full max-w-[420px] bg-[#f4f0e9] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(24,21,18,0.35),0_8px_24px_rgba(24,21,18,0.15)] transition-all duration-500 ${
          isClosing
            ? "scale-95 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
        style={{ animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Top decorative bar */}
        <div className="h-[3px] bg-gradient-to-r from-[#C48C56]/0 via-[#C48C56] to-[#C48C56]/0" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#181512]/5 hover:bg-[#181512]/10 flex items-center justify-center transition-colors group"
        >
          <svg
            className="w-3.5 h-3.5 text-[#5f5851] group-hover:text-[#181512] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pt-8 pb-7">
          {/* Avatar with glow ring */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-[#C48C56]/20 to-[#C48C56]/5 blur-md" />
            <div className="relative w-24 h-24 rounded-full border-[3px] border-[#C48C56]/30 overflow-hidden shadow-[0_8px_24px_rgba(196,140,86,0.2)]">
              <img
                src="https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/291f6bbf-3484-4dd4-a26e-531b1d4db788.jpg"
                alt="Louati Mahdi"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML =
                    '<div class="w-full h-full bg-[#C48C56]/20 flex items-center justify-center"><span style="font-family: \'Plus Jakarta Sans\', sans-serif" class="text-2xl font-medium text-[#C48C56]">LM</span></div>';
                }}
              />
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-[#f4f0e9] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#6B8E6B] shadow-[0_0_6px_rgba(107,142,107,0.5)]" />
            </div>
          </div>

          {/* Greeting label */}
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#C48C56]/70 mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <div className="h-[1px] w-5 bg-[#C48C56]/30" />
            Welcome to Lexity
            <div className="h-[1px] w-5 bg-[#C48C56]/30" />
          </div>

          {/* Main heading */}
          <h2
            className="text-[1.5rem] sm:text-[1.7rem] leading-[1.1] tracking-[-0.03em] text-[#181512] text-center mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
          >
            Hello, I&apos;m{" "}
            <span className="italic text-[#C48C56]">Louati Mahdi</span>
          </h2>

          {/* Message body */}
          <p
            className="text-[13px] leading-7 text-[#5f5851] text-center font-light mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Thank you for visiting. I built Lexity to be the intelligent partner
            every team deserves &mdash; one that remembers, understands, and
            works tirelessly alongside you to drive real results.
          </p>
          <p
            className="text-[13px] leading-7 text-[#5f5851] text-center font-light mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Take a moment to explore what autonomous intelligence can do for
            your business. I hope you find something here that inspires you.
          </p>

          {/* Signature area */}
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-[#181512]/[0.03] border border-[#d9d1c5]/60 w-full">
            <div className="h-9 w-9 rounded-full bg-[#C48C56]/15 flex items-center justify-center flex-shrink-0">
              <span
                className="text-[#C48C56] text-xs font-medium"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                LM
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] font-medium text-[#181512] leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Louati Mahdi
              </p>
              <p
                className="text-[10px] text-[#8a8178] leading-tight mt-0.5"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Industrial Engineer &middot; Sfax, Tunisia
              </p>
            </div>
            <div className="flex items-center gap-1">
              {["AI", "ML", "CV"].map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[8px] rounded bg-[#C48C56]/10 text-[#C48C56] font-medium"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handleClose}
            className="w-full group relative overflow-hidden bg-[#181512] text-[#F2EFEA] py-3.5 rounded-xl text-[13px] font-medium transition-all hover:shadow-[0_8px_24px_rgba(24,21,18,0.25)] active:scale-[0.98]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Explore the Platform
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#C48C56]/0 via-[#C48C56]/10 to-[#C48C56]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Bottom decorative element */}
        <div className="px-8 pb-5 pt-0">
          <p
            className="text-center text-[10px] text-[#8a8178]/50"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Made With Love &middot; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
