"use client";

import React, { useRef, useState, useCallback, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";

// Individual page component - must use forwardRef for react-pageflip
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = "" }, ref) => (
    <div ref={ref} className={`page-content ${className}`}>
      {children}
    </div>
  )
);
Page.displayName = "Page";

export default function LexityBookViewer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 14;

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const goNext = () => bookRef.current?.pageFlip()?.flipNext();
  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev();

  return (
    <section className="relative border-b border-[#d9d1c5] bg-[#f4f0e9] overflow-hidden">
      {/* Subtle atmospheric wash */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,140,86,0.05),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(24,21,18,0.03),transparent_22%)]" />
      </div>

      <div className="relative max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-14 py-16 sm:py-20 lg:py-24">
        {/* Section header */}
        <div className="grid lg:grid-cols-[0.34fr_1fr] gap-10 lg:gap-16 items-end mb-14 lg:mb-16">
          <div>
            <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#C48C56]" />
              Platform Guide
            </div>
            <p className="max-w-[15rem] text-[13px] leading-7 text-[#7a7268] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Discover the vision, the technology, and the people behind the platform that transforms how businesses operate.
            </p>
          </div>

          <div>
            <h2 className="tracking-[-0.04em] leading-[0.94] text-[2.2rem] sm:text-[3rem] md:text-[3.7rem] lg:text-[4rem] xl:text-[4.5rem] max-w-[16ch] text-[#181512]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
              <span>An inside look at how </span>
              <span className="italic text-[#C48C56]">Lexity</span>
              <span className="block italic text-[#C48C56]">reshapes productivity.</span>
            </h2>
            <p className="mt-6 max-w-[42rem] text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Flip through the pages to learn about our autonomous intelligence platform,
              designed to drive sales, amplify efficiency, and understand your business at every level.
            </p>
          </div>
        </div>

        {/* Book viewer */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[900px]" style={{ perspective: "2000px" }}>
            <HTMLFlipBook
              ref={bookRef}
              width={420}
              height={560}
              size="stretch"
              minWidth={300}
              maxWidth={450}
              minHeight={400}
              maxHeight={580}
              drawShadow
              flippingTime={800}
              usePortrait={false}
              startZIndex={0}
              autoSize
              maxShadowOpacity={0.4}
              showCover
              mobileScrollSupport
              onFlip={onFlip}
              className="book-flip-container"
              style={{}}
              startPage={0}
              clickEventForward={false}
              useMouseEvents
              swipeDistance={30}
              showPageCorners
              disableFlipByClick={false}
            >
              {/* ====== COVER PAGE ====== */}
              <Page className="bg-[#181512] text-[#F2EFEA] flex flex-col justify-between p-0 overflow-hidden">
                <div className="relative w-full h-full flex flex-col justify-between" style={{ minHeight: "100%" }}>
                  {/* Background image overlay */}
                  <div className="absolute inset-0">
                    <img
                      src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/b9fef1af-7076-41f8-94ac-87cf3a20563d_3840w.jpg"
                      alt=""
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#181512]/60 via-[#181512]/80 to-[#181512]" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-10">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#C48C56]/70 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                        Platform Guide 2025
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h1 className="text-[2.8rem] sm:text-[3.4rem] leading-[0.92] tracking-[-0.04em] text-[#F2EFEA] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                        Welcome
                        <br />
                        to <span className="italic text-[#C48C56]">Lexity</span>
                      </h1>
                      <p className="text-[14px] leading-7 text-[#F2EFEA]/50 max-w-[28ch] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        The autonomous intelligence platform
                        that transforms how businesses think,
                        operate, and grow.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#F2EFEA]/30 tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Crafted with love by Louati Mahdi
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-[1px] w-8 bg-[#C48C56]/30" />
                        <span className="text-[10px] text-[#C48C56]/50">Flip to begin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 1: The Vision ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    01 &mdash; The Vision
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Intelligence that works
                    <br />
                    <span className="italic text-[#C48C56]">alongside you.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      In a world drowning in data and complexity, businesses need more than
                      tools &mdash; they need a partner that thinks. Lexity was born from a
                      simple yet profound observation: the most productive teams are those
                      that spend less time searching, organizing, and repeating, and more
                      time creating, deciding, and acting.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Our platform is an autonomous intelligence system that understands
                      context, remembers every interaction, and continuously adapts to how
                      your organization works. It does not merely respond to commands &mdash;
                      it anticipates needs, surfaces insights before you ask, and handles
                      the cognitive heavy lifting so your team can focus on what truly matters.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      From startups finding their footing to enterprises managing thousands
                      of workflows, Lexity scales with you &mdash; quietly, reliably, and
                      with remarkable precision.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#d9d1c5] mt-4">
                    <p className="text-[11px] text-[#8a8178] italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      &ldquo;The best technology is the kind you forget is there &mdash;
                      it simply makes everything better.&rdquo;
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 2: Driving Sales ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    02 &mdash; Driving Sales
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Revenue growth through
                    <br />
                    <span className="italic text-[#C48C56]">intelligent engagement.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Sales teams spend an average of 65% of their time on non-selling
                      activities. Lexity reclaims that time. Our platform understands your
                      customers at a level that goes far beyond CRM data &mdash; it reads
                      behavioral patterns, predicts purchase intent, and crafts personalized
                      outreach that resonates.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Imagine every sales representative having a tireless research assistant
                      that has read every email, analyzed every call, and knows exactly which
                      prospects are ready to convert. Lexity delivers this &mdash; and does it
                      with the subtlety and precision that builds trust rather than pressure.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lead scoring becomes intuitive. Follow-ups become timely. Proposals
                      become tailored. The result is not just more deals closed, but
                      stronger relationships forged &mdash; the kind that drive lasting
                      revenue and genuine customer loyalty.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#d9d1c5] mt-4">
                    <div className="text-center">
                      <p className="text-[1.4rem] text-[#C48C56] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>3.2x</p>
                      <p className="text-[10px] text-[#8a8178] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pipeline velocity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[1.4rem] text-[#C48C56] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>47%</p>
                      <p className="text-[10px] text-[#8a8178] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Higher close rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[1.4rem] text-[#C48C56] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>68%</p>
                      <p className="text-[10px] text-[#8a8178] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Less admin time</p>
                    </div>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 3: Productivity ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    03 &mdash; Productivity
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Amplifying output without
                    <br />
                    <span className="italic text-[#C48C56]">increasing headcount.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Productivity is not about working harder &mdash; it is about working
                      with greater clarity. Lexity eliminates the friction between intention
                      and action. When a team member needs information, it is already
                      surfaced. When a decision requires data, the analysis is already done.
                      When a document needs drafting, the framework is already prepared.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Our autonomous agent operates across your entire workflow &mdash;
                      parsing documents in dozens of formats, synthesizing meeting notes,
                      generating reports, and connecting dots across conversations that
                      happened weeks or months apart. It remembers what your team discussed
                      last quarter and applies that context to today&apos;s challenges.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Whether you are a five-person startup or a five-thousand-person
                      enterprise, Lexity adapts to the rhythms of your work. It learns
                      your terminology, your priorities, and your preferred ways of
                      communicating &mdash; becoming more valuable with every interaction.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 4: Efficiency ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    04 &mdash; Efficiency
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Operational elegance at
                    <br />
                    <span className="italic text-[#C48C56]">every scale.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Efficiency in the modern enterprise means removing the invisible waste
                      &mdash; the repeated explanations, the lost context, the meetings that
                      could have been a decision. Lexity targets these inefficiencies with
                      precision, streamlining operations without disrupting the human
                      dynamics that make organizations thrive.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Our platform processes and understands documents across every major
                      format &mdash; PDF, DOCX, spreadsheets, CSVs, JSON, XML, and more.
                      It can perform exploratory data analysis on uploaded datasets, generate
                      visual dashboards, run predictive models, and deliver insights that
                      would normally require a dedicated analytics team.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      The result is an organization that moves faster, decides with greater
                      confidence, and allocates its human capital to the challenges that
                      genuinely require human creativity and judgment.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#d9d1c5] mt-4">
                    <p className="text-[11px] text-[#8a8178] italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      &ldquo;Efficiency is intelligent laziness.&rdquo; &mdash; David Dunham
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 5: Autonomous Agent ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    05 &mdash; The Autonomous Agent
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    An intelligence that can
                    <br />
                    <span className="italic text-[#C48C56]">do everything.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      At the heart of Lexity sits an autonomous agent unlike anything you
                      have encountered before. This is not a chatbot that follows scripts
                      or a search engine wrapped in a conversational interface. This is a
                      genuine thinking partner &mdash; one that can reason across domains,
                      hold complex multi-step conversations, and execute tasks with
                      remarkable autonomy.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      The agent can analyze images and videos, parse any document format,
                      generate interactive charts and knowledge graphs, run geospatial
                      visualizations, perform solar analytics for building assessments,
                      create machine learning pipelines on your data, and even browse
                      the web autonomously to gather real-time information.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Every interaction is remembered. Every conversation builds on the last.
                      The agent develops an evolving understanding of your organization,
                      your preferences, and your goals &mdash; becoming more valuable with
                      each passing day.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 6: Memory & Understanding ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    06 &mdash; Memory &amp; Understanding
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    It remembers everything.
                    <br />
                    <span className="italic text-[#C48C56]">It understands everything.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Most platforms forget the moment you close a tab. Lexity does not.
                      Our persistent memory architecture means that every conversation,
                      every document, every insight shared with the platform becomes part
                      of its understanding. When you return weeks later with a follow-up
                      question, the context is already there.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      This is not simple storage &mdash; it is comprehension. The platform
                      uses advanced embedding techniques to build a semantic map of your
                      knowledge. It can draw connections between a conversation you had in
                      January and a document you uploaded in March, surfacing relationships
                      that would be invisible to any human trying to remember it all.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Each user&apos;s memory space is completely private and isolated. Your
                      data remains yours. The intelligence grows personal to you, shaped
                      by your unique interactions and organizational context.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 7: Any Company Size ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    07 &mdash; Built for Every Scale
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    From solopreneurs to
                    <br />
                    <span className="italic text-[#C48C56]">global enterprises.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <strong className="font-medium text-[#181512]">Solo &amp; Small Teams.</strong>{" "}
                      For individual professionals and small teams, Lexity acts as an
                      extension of your own thinking. It handles research, drafts
                      communications, analyzes data, and manages the knowledge base that
                      would otherwise live scattered across notebooks and browser tabs.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <strong className="font-medium text-[#181512]">Growing Companies.</strong>{" "}
                      As organizations scale, institutional knowledge becomes fragile.
                      Lexity preserves and organizes that knowledge, ensuring that growth
                      does not come at the cost of losing what made the company effective
                      when it was small.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <strong className="font-medium text-[#181512]">Enterprise.</strong>{" "}
                      For large organizations, Lexity becomes the connective tissue between
                      departments. It breaks down information silos, accelerates
                      decision-making, and ensures that every team member has access to the
                      intelligence they need, precisely when they need it.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 8: Real-Time Collaboration ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    08 &mdash; Real-Time Collaboration
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Think together.
                    <br />
                    <span className="italic text-[#C48C56]">Build together.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Great ideas rarely come from isolation. Lexity includes a full
                      multiplayer collaboration environment where authenticated team members
                      can work together in real time on a shared infinite whiteboard.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      See your colleagues&apos; cursors as they move. Pin contextual comments
                      directly onto the canvas. Thread discussions that stay attached to
                      specific ideas. Resolve conversations as decisions are made. The
                      entire experience is designed to feel natural and unobtrusive &mdash;
                      collaboration that enhances focus rather than fragmenting it.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Create rooms, share invite links, and bring your team into a shared
                      creative space. Whether brainstorming, planning, or reviewing, the
                      whiteboard adapts to your workflow with drawing tools, shapes, text,
                      and free-form expression.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 9: Data & Analytics ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    09 &mdash; Data &amp; Analytics
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    From raw data to
                    <br />
                    <span className="italic text-[#C48C56]">actionable clarity.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Upload a CSV and watch Lexity transform it into a comprehensive
                      exploratory data analysis dashboard. Distributions, correlations,
                      outliers, and patterns &mdash; all visualized instantly through
                      interactive charts that tell the story your data has been waiting
                      to share.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      But we do not stop at visualization. Lexity includes a full AutoML
                      pipeline that can train, compare, and optimize machine learning models
                      on your data &mdash; classification, regression, clustering, anomaly
                      detection, and time series forecasting. All without writing a single
                      line of code.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Geospatial intelligence adds another dimension: heatmaps, arc layers,
                      interactive map exploration, solar potential analysis for buildings,
                      and comprehensive site analytics including demographics, climate,
                      economic, and infrastructure data for any location on Earth.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 10: Visual Intelligence ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    10 &mdash; Visual Intelligence
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Knowledge made
                    <br />
                    <span className="italic text-[#C48C56]">beautifully visible.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lexity generates rich inline diagrams and charts directly within
                      conversations. Bar charts, line graphs, pie charts, radar plots,
                      sankey diagrams, heatmaps, treemaps, network graphs, flowcharts,
                      mind maps, timelines, and more &mdash; all rendered beautifully
                      and contextually as part of the natural conversation flow.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Knowledge graphs transform conversations into visual relationship
                      maps, revealing how concepts, entities, and ideas connect across
                      your discussions. Interactive forms can be generated inline to
                      collect structured data &mdash; surveys, registrations, configurations
                      &mdash; all without leaving the conversation.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      The platform also understands images and video, enabling visual
                      analysis and interpretation as a natural extension of the dialogue.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 11: Security & Privacy ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    11 &mdash; Security &amp; Privacy
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Your intelligence,
                    <br />
                    <span className="italic text-[#C48C56]">your control.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Trust is the foundation of any intelligent system. Lexity is built
                      with privacy at its core &mdash; not as an afterthought, but as an
                      architectural principle. Every user operates within their own isolated
                      memory namespace. Your data never leaks into another user&apos;s context.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Authentication is handled through secure OAuth protocols, ensuring
                      that only verified users can access the platform. Rate limiting
                      protects against abuse, and all data is encrypted in transit.
                      The collaboration features require authentication &mdash; only
                      real, verified team members can join rooms and participate.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      We believe that intelligent systems should serve their users, not
                      exploit them. Your conversations, your documents, and your insights
                      remain yours &mdash; always.
                    </p>
                  </div>
                </div>
              </Page>

              {/* ====== PAGE 12: About the Creator ====== */}
              <Page className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-8 sm:p-10">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    12 &mdash; The Creator
                  </div>

                  <h2 className="text-[1.8rem] sm:text-[2.2rem] leading-[1] tracking-[-0.03em] text-[#181512] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                    Built with love by
                    <br />
                    <span className="italic text-[#C48C56]">Louati Mahdi.</span>
                  </h2>

                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lexity is the creation of <strong className="font-medium text-[#181512]">Louati Mahdi</strong>,
                      an Industrial Engineer based in <strong className="font-medium text-[#181512]">Sfax, Tunisia</strong>.
                      With a deep passion for technology and an engineer&apos;s instinct for
                      solving complex problems, Mahdi brings a unique perspective to the
                      intersection of artificial intelligence and business productivity.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      His interests span across <strong className="font-medium text-[#181512]">Artificial
                      Intelligence</strong>, <strong className="font-medium text-[#181512]">Machine
                      Learning</strong>, <strong className="font-medium text-[#181512]">Computer
                      Vision</strong>, and <strong className="font-medium text-[#181512]">Cybersecurity</strong>
                      &mdash; disciplines that converge in Lexity to create a platform that
                      is not only intelligent but also secure, reliable, and forward-thinking.
                    </p>
                    <p className="text-[13px] leading-7 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      What began as a personal exploration of what autonomous systems could
                      achieve has grown into a full platform designed to democratize access
                      to enterprise-grade intelligence. Every line of code reflects Mahdi&apos;s
                      belief that technology, when crafted with care, can quietly transform
                      the way people work and create.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#d9d1c5] mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#C48C56]/20 flex items-center justify-center">
                      <span className="text-[#C48C56] text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>LM</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-[#181512]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Louati Mahdi</p>
                      <p className="text-[10px] text-[#8a8178]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Industrial Engineer &middot; Sfax, Tunisia</p>
                    </div>
                  </div>
                </div>
              </Page>

              {/* ====== BACK COVER ====== */}
              <Page className="bg-[#181512] text-[#F2EFEA] p-0 overflow-hidden">
                <div className="relative w-full h-full flex flex-col justify-between" style={{ minHeight: "100%" }}>
                  <div className="absolute inset-0">
                    <img
                      src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a7f3cac8-5609-4ac0-8baf-38048221f3f6_3840w.jpg"
                      alt=""
                      className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181512] via-[#181512]/80 to-[#181512]/60" />
                  </div>

                  <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-10">
                    <div />

                    <div className="text-center">
                      <h2 className="text-[2.4rem] sm:text-[3rem] leading-[0.92] tracking-[-0.04em] text-[#F2EFEA] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
                        Ready to transform
                        <br />
                        how you <span className="italic text-[#C48C56]">work</span>?
                      </h2>
                      <p className="text-[14px] text-[#F2EFEA]/40 max-w-[32ch] mx-auto mb-8 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Sign in and experience the future of
                        autonomous intelligence. Your journey
                        with Lexity begins now.
                      </p>
                      <div className="inline-flex items-center gap-2 text-[#C48C56]/60 text-[12px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <div className="h-[1px] w-6 bg-[#C48C56]/30" />
                        lexity.app
                        <div className="h-[1px] w-6 bg-[#C48C56]/30" />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] text-[#F2EFEA]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Made With Love By Louati Mahdi &middot; 2025
                      </p>
                    </div>
                  </div>
                </div>
              </Page>
            </HTMLFlipBook>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={goPrev}
              disabled={currentPage === 0}
              className="group flex items-center gap-2 text-[12px] text-[#5f5851] hover:text-[#C48C56] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8a8178]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {Math.min(currentPage + 1, totalPages)} / {totalPages}
              </span>
              <div className="w-24 h-[2px] bg-[#d9d1c5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C48C56] rounded-full transition-all duration-500"
                  style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentPage >= totalPages - 1}
              className="group flex items-center gap-2 text-[12px] text-[#5f5851] hover:text-[#C48C56] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Next
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <p className="text-[11px] text-[#8a8178]/60 mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Click on the page corners or use the buttons to flip pages
          </p>
        </div>
      </div>

      <style jsx global>{`
        .page-content {
          background: #f4f0e9;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.03);
        }
        .stf__parent {
          margin: 0 auto;
        }
        .stf__wrapper {
          box-shadow: 0 20px 60px rgba(24,21,18,0.15), 0 4px 16px rgba(24,21,18,0.08);
          border-radius: 4px;
        }
      `}</style>
    </section>
  );
}
