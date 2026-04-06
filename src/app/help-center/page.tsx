"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Help Center – comprehensive platform guide                        */
/*  Theme-aligned: #F2EFEA bg, Plus Jakarta Sans, Instrument Serif    */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "welcome", label: "Welcome" },
  { id: "getting-started", label: "Getting Started" },
  { id: "intelligent-conversations", label: "Intelligent Conversations" },
  { id: "memory-context", label: "Memory & Context" },
  { id: "data-analytics", label: "Data & Analytics" },
  { id: "visual-insights", label: "Visual Insights" },
  { id: "geospatial-intelligence", label: "Geospatial Intelligence" },
  { id: "collaboration", label: "Real-Time Collaboration" },
  { id: "workflow-automation", label: "Workflow Automation" },
  { id: "document-management", label: "Document Management" },
  { id: "web-research", label: "Web Research" },
  { id: "voice-video", label: "Voice & Video" },
  { id: "browser-automation", label: "Browser Automation" },
  { id: "predictive-modeling", label: "Predictive Modeling" },
  { id: "graph-network", label: "Graph & Network Analysis" },
  { id: "report-generation", label: "Report Generation" },
  { id: "solar-dashboard", label: "Solar Dashboard" },
  { id: "security-privacy", label: "Security & Privacy" },
  { id: "scaling-your-team", label: "Scaling Your Team" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact & Support" },
];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HelpCenterPage() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* Track scroll position for active sidebar highlight */
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const sections = container.querySelectorAll("[data-section]");
      let current = "welcome";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 140) {
          current = section.getAttribute("data-section") || current;
        }
      });
      setActiveSection(current);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      const top = el.offsetTop - 32;
      contentRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  const filteredSections = SECTIONS.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const jakartaSans = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const instrumentSerif = { fontFamily: "'Instrument Serif', 'Plus Jakarta Sans', serif" };

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#F2EFEA]/80 backdrop-blur-xl border-b border-[#d9d1c5]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#5f5851] hover:text-[#2C2824] transition-colors"
              style={jakartaSans}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            <div className="hidden sm:block w-[1px] h-5 bg-[#d9d1c5]" />
            <div className="hidden sm:flex items-center gap-2">
              <BookIcon className="w-4 h-4 text-[#C48C56]" />
              <span
                className="text-lg tracking-tight text-[#2C2824]"
                style={instrumentSerif}
              >
                Help Center
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-64 hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8178]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-white/50 border border-[#d9d1c5] rounded-full pl-9 pr-4 py-2 text-sm text-[#2C2824] placeholder-[#a89f94] outline-none focus:border-[#C48C56] focus:bg-white transition-all"
              style={jakartaSans}
            />
          </div>

          {/* Mobile nav toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <svg className="w-5 h-5 text-[#2C2824]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNavOpen ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-[65px] left-0 z-40 h-[calc(100vh-65px)]
            w-72 bg-[#F2EFEA] md:bg-transparent border-r border-[#d9d1c5]
            overflow-y-auto transition-transform duration-300
            ${mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Mobile search */}
          <div className="md:hidden p-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8178]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full bg-white/50 border border-[#d9d1c5] rounded-full pl-9 pr-4 py-2 text-sm text-[#2C2824] placeholder-[#a89f94] outline-none focus:border-[#C48C56]"
                style={jakartaSans}
              />
            </div>
          </div>

          <nav className="p-4 pt-2 md:pt-6 space-y-0.5">
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-3 px-3"
              style={jakartaSans}
            >
              Documentation
            </p>
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${
                    activeSection === section.id
                      ? "bg-[#C48C56]/10 text-[#C48C56] border-l-2 border-[#C48C56]"
                      : "text-[#6f675f] hover:bg-white/50 hover:text-[#2C2824]"
                  }
                `}
                style={jakartaSans}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          ref={contentRef}
          className="flex-1 h-[calc(100vh-65px)] overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-16">

            {/* ===== WELCOME ===== */}
            <section data-section="welcome" id="welcome" className="mb-20">
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#6f675f] mb-6" style={jakartaSans}>
                  <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#C48C56]" />
                  Documentation
                </div>
                <h1
                  className="text-[2.8rem] md:text-[3.6rem] tracking-[-0.04em] leading-[1.05] text-[#181512] mb-6"
                  style={instrumentSerif}
                >
                  Welcome to Your{" "}
                  <span className="italic text-[#2F5D50]">Help Center</span>
                </h1>
                <p className="text-[16px] leading-8 text-[#5f5851] font-light max-w-2xl" style={jakartaSans}>
                  This guide is designed to help you understand every capability of the platform,
                  regardless of your company size or industry. Whether you are a solo founder, a
                  growing startup, or an established enterprise, this documentation will walk you
                  through how to leverage intelligent automation, deep analytics, and collaborative
                  tools to transform the way you work.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-5 mt-10">
                {[
                  { num: "01", title: "Discover", desc: "Explore every feature and understand how they connect to accelerate your business." },
                  { num: "02", title: "Implement", desc: "Follow step-by-step guidance to set up and configure each capability for your team." },
                  { num: "03", title: "Scale", desc: "Learn best practices for growing from individual use to organization-wide adoption." },
                ].map((item) => (
                  <div key={item.num} className="card-flashlight p-6 cursor-default">
                    <div className="relative z-10">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-2" style={jakartaSans}>{item.num}</p>
                      <h3 className="text-lg font-light tracking-tight mb-2 text-[#2C2824]" style={jakartaSans}>{item.title}</h3>
                      <p className="text-[13px] leading-6 text-[#7a7268] font-light" style={jakartaSans}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== GETTING STARTED ===== */}
            <section data-section="getting-started" id="getting-started" className="mb-20">
              <SectionHeader number="01" title="Getting Started" />
              <Paragraph>
                Getting up and running takes just a few moments. The platform is built to
                accommodate teams of any size, from a single user exploring possibilities to
                an entire organization standardizing on intelligent workflows.
              </Paragraph>
              <SubHeading>Creating Your Account</SubHeading>
              <Paragraph>
                Sign in securely using your existing business credentials. Once authenticated,
                you are immediately taken to your personal workspace where all your conversations,
                data, and insights live. There is no complex setup or configuration needed -- the
                platform adapts to your needs from the very first interaction.
              </Paragraph>
              <SubHeading>Your Workspace</SubHeading>
              <Paragraph>
                Your workspace is the central hub for everything you do. From here you can start
                conversations with the intelligent assistant, create and manage reports, launch
                data visualizations, collaborate with team members in real time, and access every
                tool the platform offers. Think of it as your command center -- everything you need
                is one click away.
              </Paragraph>
              <SubHeading>First Steps for Any Company Size</SubHeading>
              <BulletList items={[
                "Solo founders: Start with the conversation assistant to brainstorm, research, and plan. Use the report generator to create professional documents in minutes.",
                "Small teams (2-20): Enable real-time collaboration so every team member can work together on documents, whiteboards, and data analysis simultaneously.",
                "Growing organizations (20-200): Set up workflow automation to standardize repetitive processes and use the analytics dashboard to track key metrics across departments.",
                "Enterprise (200+): Leverage the full platform with advanced security, team management, custom integrations, and organization-wide analytics.",
              ]} />
            </section>

            {/* ===== INTELLIGENT CONVERSATIONS ===== */}
            <section data-section="intelligent-conversations" id="intelligent-conversations" className="mb-20">
              <SectionHeader number="02" title="Intelligent Conversations" />
              <Paragraph>
                At the heart of the platform is a deeply intelligent conversation system that goes
                far beyond simple question-and-answer exchanges. It understands context, remembers
                your history, and provides responses that are tailored specifically to your needs
                and previous interactions.
              </Paragraph>
              <SubHeading>How It Works</SubHeading>
              <Paragraph>
                When you start a conversation, the assistant draws on a rich understanding of your
                past interactions, uploaded documents, and organizational knowledge to provide
                contextually relevant responses. It does not just answer questions -- it anticipates
                your needs, suggests follow-up actions, and connects dots across different topics
                you have explored.
              </Paragraph>
              <SubHeading>What You Can Do</SubHeading>
              <BulletList items={[
                "Ask complex business questions and receive detailed, actionable answers backed by data.",
                "Upload documents and have the assistant analyze, summarize, and extract key insights automatically.",
                "Request the creation of reports, presentations, or analyses directly within the conversation.",
                "Get recommendations based on patterns found across your historical data and interactions.",
                "Conduct deep research on any topic with real-time web search integration.",
              ]} />
              <SubHeading>For Your Business</SubHeading>
              <Paragraph>
                Every conversation makes the system smarter about your specific context. Over time,
                the assistant becomes an invaluable partner that understands your business terminology,
                preferences, and goals. This means faster responses, more relevant suggestions, and
                a truly personalized experience that improves with every interaction.
              </Paragraph>
            </section>

            {/* ===== MEMORY & CONTEXT ===== */}
            <section data-section="memory-context" id="memory-context" className="mb-20">
              <SectionHeader number="03" title="Memory & Context" />
              <Paragraph>
                Unlike traditional tools that treat every session as a blank slate, this platform
                remembers everything. Your conversations, preferences, uploaded files, and analytical
                history form a persistent knowledge base that grows more valuable over time.
              </Paragraph>
              <SubHeading>Persistent Memory</SubHeading>
              <Paragraph>
                Every conversation is stored and indexed intelligently. When you return to a topic
                weeks or months later, the assistant can recall exactly what was discussed, what
                conclusions were reached, and what actions were taken. This eliminates the
                frustrating need to repeat context or re-explain your situation.
              </Paragraph>
              <SubHeading>Cross-Conversation Awareness</SubHeading>
              <Paragraph>
                The system connects insights across different conversations. If you discussed market
                trends in one conversation and competitor analysis in another, the assistant can
                draw connections between these topics when relevant. This creates a compounding
                intelligence effect -- the more you use the platform, the more insightful it becomes.
              </Paragraph>
              <SubHeading>Why This Matters for Your Organization</SubHeading>
              <Paragraph>
                For companies of any size, institutional knowledge is one of the most valuable
                and fragile assets. Key insights are often trapped in individual employees' heads
                or buried in email threads. This platform captures and organizes that knowledge
                automatically, making it accessible, searchable, and actionable for everyone
                who needs it.
              </Paragraph>
            </section>

            {/* ===== DATA & ANALYTICS ===== */}
            <section data-section="data-analytics" id="data-analytics" className="mb-20">
              <SectionHeader number="04" title="Data & Analytics" />
              <Paragraph>
                Transform raw data into clear, actionable insights without needing specialized
                technical skills. The platform includes a comprehensive analytics suite that
                handles everything from exploratory data analysis to advanced statistical modeling.
              </Paragraph>
              <SubHeading>Exploratory Data Analysis</SubHeading>
              <Paragraph>
                Upload any dataset and instantly receive a comprehensive analysis that includes
                statistical summaries, distribution patterns, correlation matrices, outlier detection,
                and missing value analysis. The system automatically identifies the most interesting
                patterns and anomalies in your data, saving hours of manual investigation.
              </Paragraph>
              <SubHeading>Interactive Dashboards</SubHeading>
              <Paragraph>
                Create stunning, interactive dashboards that update in real time. Choose from a
                wide variety of chart types -- bar charts, line graphs, scatter plots, heatmaps,
                radar charts, funnel visualizations, treemaps, and many more. Each visualization
                is interactive, allowing you to zoom, filter, and drill down into the details
                that matter most.
              </Paragraph>
              <SubHeading>Business Applications</SubHeading>
              <BulletList items={[
                "Sales teams can track pipeline metrics, conversion rates, and revenue trends with live dashboards.",
                "Marketing teams can analyze campaign performance, audience segmentation, and attribution models.",
                "Operations teams can monitor supply chain metrics, efficiency indicators, and resource utilization.",
                "Finance teams can create real-time financial dashboards, budget tracking, and forecasting models.",
                "Executive teams can access organization-wide KPI dashboards with drill-down capabilities.",
              ]} />
            </section>

            {/* ===== VISUAL INSIGHTS ===== */}
            <section data-section="visual-insights" id="visual-insights" className="mb-20">
              <SectionHeader number="05" title="Visual Insights" />
              <Paragraph>
                The platform offers an extensive suite of visualization capabilities that transform
                complex data into clear, beautiful, and interactive visual stories. From simple
                charts to complex network diagrams, every visualization is designed to communicate
                insights effectively.
              </Paragraph>
              <SubHeading>Chart Types Available</SubHeading>
              <BulletList items={[
                "Standard charts: Bar, line, area, pie, donut, and scatter plots for everyday data visualization.",
                "Statistical charts: Box plots, violin plots, and swarm plots for distribution analysis.",
                "Hierarchical charts: Treemaps, sunburst diagrams, and circle packing for nested data structures.",
                "Flow charts: Sankey diagrams and parallel coordinates for understanding data flows and relationships.",
                "Specialized charts: Radar charts, funnel charts, waffle charts, bump charts, and calendar heatmaps.",
                "Network visualizations: Force-directed graphs, temporal networks, and community detection plots.",
              ]} />
              <SubHeading>Interactive Canvas</SubHeading>
              <Paragraph>
                Beyond standard charts, the platform includes a full-featured interactive canvas
                where you can build custom visual compositions. Place charts, images, text blocks,
                and diagrams on an infinite canvas. Drag, resize, and arrange elements freely to
                create presentation-ready visual stories that communicate complex ideas clearly.
              </Paragraph>
              <SubHeading>Diagram Creation</SubHeading>
              <Paragraph>
                Create professional diagrams including flowcharts, sequence diagrams, entity-relationship
                diagrams, and architectural diagrams directly from natural language descriptions.
                Simply describe what you want to visualize, and the system generates a polished,
                editable diagram that you can refine and export.
              </Paragraph>
            </section>

            {/* ===== GEOSPATIAL INTELLIGENCE ===== */}
            <section data-section="geospatial-intelligence" id="geospatial-intelligence" className="mb-20">
              <SectionHeader number="06" title="Geospatial Intelligence" />
              <Paragraph>
                Bring location-based data to life with powerful mapping and geospatial analysis
                capabilities. Whether you need to visualize customer distribution, analyze regional
                performance, or explore geographic patterns, the platform provides enterprise-grade
                mapping tools accessible to everyone.
              </Paragraph>
              <SubHeading>Interactive Maps</SubHeading>
              <Paragraph>
                Create rich, interactive maps that layer multiple data sources simultaneously.
                Visualize data points, heat zones, flow patterns, and regional boundaries on
                high-resolution maps that support pan, zoom, and detailed inspection of any area.
                The mapping system handles everything from local neighborhood analysis to global
                market visualization.
              </Paragraph>
              <SubHeading>Geospatial Analytics</SubHeading>
              <BulletList items={[
                "Regional performance analysis: Compare metrics across cities, states, or countries with color-coded maps.",
                "Customer distribution mapping: Visualize where your customers are located and identify underserved areas.",
                "Supply chain visualization: Map your entire supply chain to identify bottlenecks and optimization opportunities.",
                "Market expansion planning: Overlay demographic data, competitor locations, and market potential on a single map.",
                "Route optimization: Analyze travel patterns and optimize delivery or service routes.",
              ]} />
            </section>

            {/* ===== REAL-TIME COLLABORATION ===== */}
            <section data-section="collaboration" id="collaboration" className="mb-20">
              <SectionHeader number="07" title="Real-Time Collaboration" />
              <Paragraph>
                Work together with your team as if you were in the same room, no matter where
                anyone is located. The platform includes comprehensive real-time collaboration
                features that make remote and hybrid teamwork seamless and productive.
              </Paragraph>
              <SubHeading>Collaborative Editing</SubHeading>
              <Paragraph>
                Multiple team members can work on the same document, analysis, or canvas
                simultaneously. See each other's cursors in real time, leave contextual comments
                on specific elements, and watch changes happen live. There is no need to worry
                about version conflicts -- the system handles synchronization automatically.
              </Paragraph>
              <SubHeading>Collaborative Whiteboard</SubHeading>
              <Paragraph>
                A shared infinite whiteboard where teams can brainstorm, sketch ideas, create
                diagrams, and organize thoughts visually. Everyone can draw, add sticky notes,
                insert images, and arrange content in real time. It is the digital equivalent
                of gathering around a physical whiteboard, but with superpowers.
              </Paragraph>
              <SubHeading>Team Communication</SubHeading>
              <BulletList items={[
                "Threaded comments on any document, chart, or data point for contextual discussions.",
                "Inline annotations that attach directly to specific elements in your workspace.",
                "Shared workspaces where team members can access common resources and projects.",
                "Activity feeds that keep everyone informed about changes and updates across the workspace.",
              ]} />
            </section>

            {/* ===== WORKFLOW AUTOMATION ===== */}
            <section data-section="workflow-automation" id="workflow-automation" className="mb-20">
              <SectionHeader number="08" title="Workflow Automation" />
              <Paragraph>
                Eliminate repetitive manual work by building automated workflows that handle
                routine tasks intelligently. The visual workflow builder lets you design complex
                multi-step processes without writing a single line of code.
              </Paragraph>
              <SubHeading>Visual Workflow Builder</SubHeading>
              <Paragraph>
                Design workflows by connecting trigger events, processing steps, conditions,
                and actions on an intuitive visual canvas. Each workflow can include branching
                logic, parallel execution paths, error handling, and human approval steps.
                The drag-and-drop interface makes it easy to create even complex automation
                sequences in minutes.
              </Paragraph>
              <SubHeading>What You Can Automate</SubHeading>
              <BulletList items={[
                "Data processing pipelines: Automatically clean, transform, and analyze incoming data from any source.",
                "Report generation: Schedule and automate the creation of recurring reports with the latest data.",
                "Alert systems: Set up intelligent alerts that notify you when specific conditions are met in your data.",
                "Content workflows: Automate content creation, review, and publishing processes.",
                "Customer communication: Build automated response flows for common customer inquiries.",
                "Onboarding sequences: Create step-by-step onboarding workflows for new team members or customers.",
              ]} />
              <SubHeading>How This Helps Your Company Grow</SubHeading>
              <Paragraph>
                As your organization scales, manual processes become bottlenecks. Workflow automation
                ensures that your operational capacity scales with your growth. Tasks that once
                required dedicated staff hours are handled automatically, freeing your team to
                focus on high-value strategic work. Small teams can operate with the efficiency
                of much larger organizations.
              </Paragraph>
            </section>

            {/* ===== DOCUMENT MANAGEMENT ===== */}
            <section data-section="document-management" id="document-management" className="mb-20">
              <SectionHeader number="09" title="Document Management" />
              <Paragraph>
                Upload, organize, and intelligently process documents of any type. The platform
                extracts knowledge from your files and makes it searchable, analyzable, and
                actionable across your entire workspace.
              </Paragraph>
              <SubHeading>Supported Formats</SubHeading>
              <Paragraph>
                Work with PDFs, spreadsheets, text documents, presentations, images, and more.
                The system automatically extracts text, tables, and structured data from uploaded
                files, making the content immediately available for analysis, search, and
                conversation with the intelligent assistant.
              </Paragraph>
              <SubHeading>Intelligent Document Processing</SubHeading>
              <BulletList items={[
                "Automatic summarization: Get concise summaries of long documents in seconds.",
                "Key insight extraction: The system identifies and highlights the most important information.",
                "Cross-document analysis: Compare and find connections across multiple documents.",
                "Table and data extraction: Pull structured data from PDFs and images automatically.",
                "Document-grounded conversations: Ask questions about your documents and get answers with source citations.",
              ]} />
            </section>

            {/* ===== WEB RESEARCH ===== */}
            <section data-section="web-research" id="web-research" className="mb-20">
              <SectionHeader number="10" title="Web Research" />
              <Paragraph>
                Conduct comprehensive web research without leaving the platform. The integrated
                search engine finds, aggregates, and synthesizes information from across the
                internet, presenting results in a clear, organized format with source attribution.
              </Paragraph>
              <SubHeading>Research Capabilities</SubHeading>
              <BulletList items={[
                "Real-time web search: Find the latest information on any topic with results from multiple sources.",
                "Source aggregation: Results are gathered from diverse sources and cross-referenced for accuracy.",
                "Automatic summarization: Long articles and research papers are condensed into actionable summaries.",
                "Citation tracking: Every piece of information is linked back to its original source for verification.",
                "Competitive intelligence: Monitor competitors, industry trends, and market developments automatically.",
              ]} />
              <SubHeading>Research Workflow</SubHeading>
              <Paragraph>
                Start with a question or topic, and the system conducts a thorough multi-source
                investigation. Results are presented with relevance scoring, key highlights, and
                the option to dive deeper into any specific area. You can save research sessions,
                share findings with your team, and incorporate results directly into reports and
                documents.
              </Paragraph>
            </section>

            {/* ===== VOICE & VIDEO ===== */}
            <section data-section="voice-video" id="voice-video" className="mb-20">
              <SectionHeader number="11" title="Voice & Video" />
              <Paragraph>
                Communicate naturally using voice interactions and video calls built directly
                into the platform. No need to switch between different applications -- everything
                happens in one unified workspace.
              </Paragraph>
              <SubHeading>Voice Assistant</SubHeading>
              <Paragraph>
                Interact with the intelligent assistant using your voice. Ask questions, dictate
                notes, request analysis, and control the platform hands-free. The voice system
                understands natural speech patterns and responds conversationally, making it
                feel like talking to a knowledgeable colleague.
              </Paragraph>
              <SubHeading>Video Meetings</SubHeading>
              <Paragraph>
                Host or join video calls directly within the platform. During meetings, the
                system can generate real-time transcriptions, create meeting summaries, extract
                action items, and even analyze sentiment and engagement levels. After the meeting,
                a comprehensive report is automatically generated and shared with all participants.
              </Paragraph>
            </section>

            {/* ===== BROWSER AUTOMATION ===== */}
            <section data-section="browser-automation" id="browser-automation" className="mb-20">
              <SectionHeader number="12" title="Browser Automation" />
              <Paragraph>
                Automate repetitive browser-based tasks with an intelligent agent that can navigate
                websites, fill forms, extract data, and perform complex multi-step actions on
                your behalf. Simply describe what you need in plain language, and the system
                handles the rest.
              </Paragraph>
              <SubHeading>Use Cases</SubHeading>
              <BulletList items={[
                "Data extraction: Automatically collect information from websites, directories, and online databases.",
                "Form automation: Fill out recurring forms, applications, or submissions automatically.",
                "Monitoring: Track changes on specific web pages and receive alerts when updates occur.",
                "Price tracking: Monitor competitor pricing across multiple platforms in real time.",
                "Content aggregation: Gather relevant articles, news, and resources from specified sources.",
              ]} />
            </section>

            {/* ===== PREDICTIVE MODELING ===== */}
            <section data-section="predictive-modeling" id="predictive-modeling" className="mb-20">
              <SectionHeader number="13" title="Predictive Modeling" />
              <Paragraph>
                Harness the power of machine learning to predict future outcomes, identify
                patterns, and make data-driven decisions. The platform's automated modeling
                system makes advanced predictive analytics accessible to everyone, regardless
                of technical background.
              </Paragraph>
              <SubHeading>Automated Model Building</SubHeading>
              <Paragraph>
                Upload your historical data, define what you want to predict, and the system
                automatically selects the best modeling approach, trains multiple models, and
                presents the most accurate results. The entire process is transparent -- you can
                see which factors are most influential, how confident the predictions are, and
                where uncertainty exists.
              </Paragraph>
              <SubHeading>Applications for Business Growth</SubHeading>
              <BulletList items={[
                "Sales forecasting: Predict future revenue based on historical trends and current pipeline data.",
                "Customer churn prediction: Identify customers at risk of leaving before they actually do.",
                "Demand forecasting: Anticipate product demand to optimize inventory and staffing levels.",
                "Risk assessment: Evaluate risk factors across business decisions with probabilistic scoring.",
                "Resource planning: Predict future resource needs based on growth patterns and project pipelines.",
              ]} />
            </section>

            {/* ===== GRAPH & NETWORK ANALYSIS ===== */}
            <section data-section="graph-network" id="graph-network" className="mb-20">
              <SectionHeader number="14" title="Graph & Network Analysis" />
              <Paragraph>
                Understand complex relationships within your data using powerful graph and network
                analysis tools. Visualize connections between people, organizations, transactions,
                or any entities to uncover hidden patterns and influence structures.
              </Paragraph>
              <SubHeading>Network Visualization</SubHeading>
              <Paragraph>
                Create interactive network graphs that reveal the structure of relationships in
                your data. Nodes represent entities (people, companies, products, topics) and
                edges represent connections between them. The visualization automatically
                identifies clusters, central influencers, and bridge connections that are
                critical for understanding your ecosystem.
              </Paragraph>
              <SubHeading>Community Detection</SubHeading>
              <Paragraph>
                The system automatically identifies natural groupings and communities within
                your network data. This is invaluable for customer segmentation, organizational
                analysis, market mapping, and understanding how information flows through your
                business ecosystem. Each community is highlighted with distinct visual markers,
                making it easy to see the overall structure at a glance.
              </Paragraph>
            </section>

            {/* ===== REPORT GENERATION ===== */}
            <section data-section="report-generation" id="report-generation" className="mb-20">
              <SectionHeader number="15" title="Report Generation" />
              <Paragraph>
                Create professional, branded reports automatically from your data, analyses,
                and conversations. The system generates polished documents that are ready for
                presentation to stakeholders, clients, or team members.
              </Paragraph>
              <SubHeading>Report Types</SubHeading>
              <BulletList items={[
                "Executive summaries: Concise overviews of key findings and recommendations for decision makers.",
                "Analytical reports: Detailed data analysis with charts, tables, and statistical insights.",
                "Meeting reports: Automatic summaries of video meetings including transcripts, action items, and key decisions.",
                "Research reports: Comprehensive documents synthesizing web research, document analysis, and data insights.",
                "Custom reports: Design your own report templates with specific sections, branding, and formatting.",
              ]} />
              <SubHeading>Export and Sharing</SubHeading>
              <Paragraph>
                Export reports in multiple formats including PDF for distribution, interactive
                web formats for online sharing, and editable formats for further customization.
                Reports can be scheduled for automatic generation and delivery, ensuring that
                stakeholders always have access to the latest information without any manual effort.
              </Paragraph>
            </section>

            {/* ===== SOLAR DASHBOARD ===== */}
            <section data-section="solar-dashboard" id="solar-dashboard" className="mb-20">
              <SectionHeader number="16" title="Solar Dashboard" />
              <Paragraph>
                A specialized real-time intelligence dashboard for the solar energy market. This
                feature demonstrates the platform's ability to create domain-specific, data-rich
                dashboards that deliver actionable insights for specific industries.
              </Paragraph>
              <SubHeading>What It Includes</SubHeading>
              <BulletList items={[
                "Live pricing data: Real-time solar panel pricing across multiple regions, updated continuously.",
                "Market trends: Historical price movements, seasonal patterns, and emerging trends visualized over time.",
                "Regional comparison: Side-by-side analysis of market conditions across different geographic areas.",
                "Supplier analytics: Performance metrics and pricing patterns for different manufacturers and models.",
                "Sentiment analysis: Customer and market sentiment derived from reviews, social media, and industry reports.",
                "Interactive exploration: Click, filter, and drill into any data point for deeper analysis.",
              ]} />
              <SubHeading>For Your Industry</SubHeading>
              <Paragraph>
                While the Solar Dashboard focuses on energy markets, it illustrates the platform's
                capability to build similar domain-specific dashboards for any industry. Whether
                you operate in healthcare, finance, retail, manufacturing, or technology, the same
                real-time data aggregation and visualization engine can be configured to serve
                your specific market intelligence needs.
              </Paragraph>
            </section>

            {/* ===== SECURITY & PRIVACY ===== */}
            <section data-section="security-privacy" id="security-privacy" className="mb-20">
              <SectionHeader number="17" title="Security & Privacy" />
              <Paragraph>
                Your data is treated with the highest level of care and protection. The platform
                is designed with security and privacy as foundational principles, not afterthoughts.
              </Paragraph>
              <SubHeading>Data Protection</SubHeading>
              <BulletList items={[
                "Isolated user spaces: Each user's data is completely separated from others, ensuring no cross-contamination.",
                "Encrypted storage: All data is encrypted at rest and in transit using industry-standard encryption protocols.",
                "Secure authentication: Multi-factor authentication and secure session management protect account access.",
                "Access controls: Fine-grained permissions let you control who can see and modify specific resources.",
                "Data residency: Your data stays in the regions you specify, complying with local data sovereignty regulations.",
              ]} />
              <SubHeading>Compliance & Trust</SubHeading>
              <Paragraph>
                The platform is built to meet the security requirements of organizations of all
                sizes, from startups that need simple, secure defaults to enterprises that require
                comprehensive compliance frameworks. Regular security audits, transparent data
                practices, and clear data retention policies ensure that your information is
                always protected and that you remain in full control.
              </Paragraph>
            </section>

            {/* ===== SCALING YOUR TEAM ===== */}
            <section data-section="scaling-your-team" id="scaling-your-team" className="mb-20">
              <SectionHeader number="18" title="Scaling Your Team" />
              <Paragraph>
                The platform grows with you. Whether you are adding your second team member or
                onboarding your thousandth, the system scales seamlessly to accommodate your
                expanding needs.
              </Paragraph>
              <SubHeading>Growth Path</SubHeading>
              <div className="space-y-6 mt-6">
                {[
                  {
                    stage: "Individual",
                    desc: "Start with the intelligent conversation assistant and personal analytics. Build your knowledge base and establish workflows that work for you.",
                  },
                  {
                    stage: "Small Team",
                    desc: "Invite team members, enable real-time collaboration, and share workspaces. Establish common workflows and templates that ensure consistency.",
                  },
                  {
                    stage: "Department",
                    desc: "Scale to department-level with dedicated dashboards, automated reporting, and role-based access controls. Integrate with existing business processes.",
                  },
                  {
                    stage: "Organization",
                    desc: "Full organizational deployment with enterprise security, custom integrations, dedicated support, and organization-wide analytics and governance.",
                  },
                ].map((item) => (
                  <div key={item.stage} className="border-l-2 border-[#C48C56]/30 pl-6">
                    <h4 className="text-[15px] font-medium text-[#2C2824] mb-1" style={jakartaSans}>{item.stage}</h4>
                    <p className="text-[14px] leading-7 text-[#7a7268] font-light" style={jakartaSans}>{item.desc}</p>
                  </div>
                ))}
              </div>
              <SubHeading>Understanding Your Processes</SubHeading>
              <Paragraph>
                Before scaling, the platform helps you understand your existing processes. The
                analytics and workflow tools create visibility into how work actually flows through
                your organization. This understanding is essential for identifying inefficiencies,
                removing bottlenecks, and designing optimized processes that scale effectively.
                Many organizations discover that the insights gained from this analysis alone
                deliver significant value, even before automating anything.
              </Paragraph>
            </section>

            {/* ===== FAQ ===== */}
            <section data-section="faq" id="faq" className="mb-20">
              <SectionHeader number="19" title="Frequently Asked Questions" />
              <div className="space-y-6 mt-6">
                {[
                  {
                    q: "How quickly can my team get started?",
                    a: "Most teams are productive within minutes of signing up. The platform requires no installation, configuration, or training. The interface is intuitive, and the intelligent assistant is available immediately to guide you through any feature.",
                  },
                  {
                    q: "Can I use this for my specific industry?",
                    a: "Absolutely. The platform is industry-agnostic and adapts to any business context. Whether you work in technology, healthcare, finance, retail, manufacturing, education, or any other sector, the tools are flexible enough to address your specific needs.",
                  },
                  {
                    q: "How does the platform handle large datasets?",
                    a: "The analytics engine is optimized for performance at scale. It can process and visualize datasets with millions of rows efficiently, providing interactive exploration without lag. For extremely large datasets, the system uses intelligent sampling and progressive loading to maintain responsiveness.",
                  },
                  {
                    q: "Is my data shared with other users?",
                    a: "No. Each user and organization has a completely isolated data environment. Your conversations, documents, analyses, and insights are visible only to you and the team members you explicitly grant access to.",
                  },
                  {
                    q: "Can I integrate this with my existing tools?",
                    a: "The platform is designed to work alongside your existing workflow. Document upload supports all common formats, and data can be imported from spreadsheets and databases. The workflow automation system can connect to external services and APIs for seamless integration.",
                  },
                  {
                    q: "How does this help small companies compete with larger ones?",
                    a: "The platform gives small teams access to capabilities that were traditionally only available to large organizations with dedicated data teams, analysts, and extensive infrastructure. A team of five using this platform can conduct market research, analyze data, generate reports, and automate workflows with the same sophistication as teams ten times their size.",
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-[#d9d1c5] pt-5">
                    <h4 className="text-[15px] font-medium text-[#2C2824] mb-2" style={jakartaSans}>{item.q}</h4>
                    <p className="text-[14px] leading-7 text-[#7a7268] font-light" style={jakartaSans}>{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== CONTACT & SUPPORT ===== */}
            <section data-section="contact" id="contact" className="mb-20">
              <SectionHeader number="20" title="Contact & Support" />
              <Paragraph>
                We are here to help you succeed. Whether you need technical guidance, have a
                feature request, or want to explore how the platform can address a specific
                business challenge, our support team is ready to assist.
              </Paragraph>
              <SubHeading>Getting Help</SubHeading>
              <BulletList items={[
                "Product Guide: Use the intelligent chat assistant on the home page to ask any question about the platform.",
                "Documentation: This Help Center covers every feature in detail -- use the sidebar to navigate to any topic.",
                "Community: Connect with other users to share best practices, templates, and workflow ideas.",
                "Direct Support: Reach out to our team for personalized assistance with complex requirements or enterprise needs.",
              ]} />
              <div className="mt-10 p-8 bg-[#2C2824] rounded-2xl">
                <h3
                  className="text-[1.6rem] tracking-tight text-[#F2EFEA] mb-3"
                  style={instrumentSerif}
                >
                  Ready to transform how your team works?
                </h3>
                <p className="text-[14px] leading-7 text-[#F2EFEA]/70 font-light mb-6" style={jakartaSans}>
                  Start exploring the platform today. Every feature described in this guide is
                  available and waiting for you to put it to work for your business.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 bg-[#C48C56] text-white px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105 hover:bg-[#b07a48]"
                  style={jakartaSans}
                >
                  Get Started Now
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({ number, title }: { number: string; title: string }) {
  const instrumentSerif = { fontFamily: "'Instrument Serif', 'Plus Jakarta Sans', serif" };
  const jakartaSans = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  return (
    <div className="mb-6 pb-6 border-b border-[#d9d1c5]">
      <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-3" style={jakartaSans}>
        <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2F5D50]" />
        Section {number}
      </div>
      <h2
        className="text-[2rem] md:text-[2.6rem] tracking-[-0.03em] leading-[1.1] text-[#181512]"
        style={instrumentSerif}
      >
        {title}
      </h2>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[17px] font-medium text-[#2C2824] mt-8 mb-3 tracking-tight"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[15px] leading-8 text-[#5f5851] font-light"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C48C56] mt-2.5 flex-shrink-0" />
          <span
            className="text-[14px] leading-7 text-[#6f675f] font-light"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
