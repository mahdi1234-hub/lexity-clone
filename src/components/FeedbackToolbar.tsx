"use client";

import React, { useState } from "react";

type FeedbackTab = "feedback" | "rating" | "contact";

export default function FeedbackToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackTab>("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setRating(0);
    setHoverRating(0);
    setError("");
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    if (activeTab === "rating" && rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (activeTab === "contact" && !email.trim()) {
      setError("Please enter your email so we can reply.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          name: name.trim() || "Anonymous",
          email: email.trim(),
          rating: activeTab === "rating" ? rating : undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      setSent(true);
      setTimeout(() => {
        setSent(false);
        resetForm();
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const tabs: { key: FeedbackTab; label: string; icon: string }[] = [
    { key: "feedback", label: "Feedback", icon: "💬" },
    { key: "rating", label: "Rate", icon: "⭐" },
    { key: "contact", label: "Contact", icon: "📧" },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#2C2824] text-[#F2EFEA] px-5 py-3 rounded-full shadow-lg hover:bg-[#2F5D50] transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-medium">Feedback</span>
        </button>
      )}

      {/* Feedback Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-[#F2EFEA] border border-[#d9d1c5] rounded-2xl shadow-2xl overflow-hidden"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {/* Header */}
          <div className="bg-[#2C2824] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2F5D50] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[#F2EFEA] text-[14px] font-medium">Share Your Thoughts</span>
            </div>
            <button
              onClick={() => { setIsOpen(false); resetForm(); }}
              className="text-[#F2EFEA]/60 hover:text-[#F2EFEA] transition-colors p-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Success State */}
          {sent ? (
            <div className="px-5 py-10 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-[16px] text-[#181512] font-medium mb-1">Thank you!</p>
              <p className="text-[13px] text-[#8a8178]">Your {activeTab} has been sent successfully.</p>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex border-b border-[#d9d1c5]">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition-colors ${
                      activeTab === tab.key
                        ? "text-[#2F5D50] border-b-2 border-[#2F5D50] bg-white/50"
                        : "text-[#8a8178] hover:text-[#5f5851]"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="px-5 py-4 space-y-3">
                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-[#2C2824] uppercase tracking-wide block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-white border border-[#d9d1c5] rounded-lg px-3 py-2 text-[14px] text-[#000] placeholder:text-[#999] outline-none focus:border-[#C48C56] transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-semibold text-[#2C2824] uppercase tracking-wide block mb-1">
                    Email {activeTab === "contact" && <span className="text-[#C48C56]">*</span>}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === "contact" ? "Required for reply" : "Optional"}
                    className="w-full bg-white border border-[#d9d1c5] rounded-lg px-3 py-2 text-[14px] text-[#000] placeholder:text-[#999] outline-none focus:border-[#C48C56] transition-colors"
                  />
                </div>

                {/* Rating (only for rating tab) */}
                {activeTab === "rating" && (
                  <div>
                    <label className="text-[11px] font-semibold text-[#2C2824] uppercase tracking-wide block mb-2">
                      Rate Your Experience <span className="text-[#C48C56]">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="text-[28px] transition-transform hover:scale-110 active:scale-95"
                        >
                          {star <= (hoverRating || rating) ? (
                            <span className="text-[#C48C56]">★</span>
                          ) : (
                            <span className="text-[#d9d1c5]">☆</span>
                          )}
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-[13px] text-[#2F5D50] font-medium">
                          {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="text-[11px] font-semibold text-[#2C2824] uppercase tracking-wide block mb-1">
                    {activeTab === "feedback" ? "Your Feedback" : activeTab === "rating" ? "Comments" : "Message"} <span className="text-[#C48C56]">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      activeTab === "feedback"
                        ? "Tell us what you think about the platform..."
                        : activeTab === "rating"
                        ? "What did you like or what could be improved?"
                        : "Write your message to the founder..."
                    }
                    rows={3}
                    className="w-full bg-white border border-[#d9d1c5] rounded-lg px-3 py-2 text-[14px] text-[#000] placeholder:text-[#999] outline-none focus:border-[#C48C56] transition-colors resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    ⚠️ {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-[#2F5D50] text-[#F2EFEA] px-4 py-3 rounded-lg text-[13px] font-medium transition-all hover:bg-[#264a40] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {activeTab === "contact" ? "Send to Founder" : activeTab === "rating" ? "Submit Rating" : "Send Feedback"}
                    </>
                  )}
                </button>

                {/* Contact info hint */}
                {activeTab === "contact" && (
                  <p className="text-[11px] text-[#8a8178] text-center">
                    📧 Your message will be sent directly to the founder
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
