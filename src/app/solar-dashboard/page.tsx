"use client";

import { useEffect, useRef, useState } from "react";

export default function SolarDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (!showDashboard || !containerRef.current) return;

    const shadow = containerRef.current.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 80vh;
        }
        .viewer-container {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }
        perspective-viewer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
      </style>
      <link rel="stylesheet" crossorigin="anonymous" href="https://cdn.jsdelivr.net/npm/@perspective-dev/viewer/dist/css/themes.css" />
      <div class="viewer-container">
        <perspective-viewer></perspective-viewer>
      </div>
    `;

    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import "https://cdn.jsdelivr.net/npm/@perspective-dev/viewer@4.3.0/dist/cdn/perspective-viewer.js";
      import "https://cdn.jsdelivr.net/npm/@perspective-dev/viewer-datagrid@4.3.0/dist/cdn/perspective-viewer-datagrid.js";
      import "https://cdn.jsdelivr.net/npm/@perspective-dev/viewer-d3fc@4.3.0/dist/cdn/perspective-viewer-d3fc.js";
      import perspective from "https://cdn.jsdelivr.net/npm/@perspective-dev/client@4.3.0/dist/cdn/perspective.js";

      var SOLAR_PANELS = [
        "JA Solar 550W", "Longi Hi-MO 6", "Trina Vertex S+", "Canadian Solar 580W",
        "Jinko Tiger Neo", "Risen Energy 570W", "BYD Solar 450W", "Q Cells Q.PEAK",
        "Hanwha 400W", "Seraphim 500W", "Yingli Panda 3.0", "Suntech Ultra V", "GCL System 540W"
      ];
      var REGIONS = ["Tunis","Sfax","Sousse","Monastir","Bizerte","Gabes","Tozeur","Kairouan","Nabeul"];
      var CATEGORIES = ["price_update","news","review","announcement","release","customer_feedback"];
      var SUPPLIERS = ["SolarTech Tunisia","Ennakl Solar","STEG Renewables","TunSolar Energy","MedSun Power","Carthage Solar","SahaSun Systems","GreenTech TN","Atlas Solar Tunisia"];
      var SENTIMENTS = ["positive","negative","neutral"];

      var headlines = [
        "Tunisia increases solar capacity target to 3.8 GW by 2030",
        "New subsidy program for residential solar installations in Tunisia",
        "STEG announces net metering expansion for solar prosumers",
        "Solar panel imports to Tunisia up 45% year-over-year",
        "Tozeur solar plant achieves record output in summer 2025",
        "Tunisia-EU green energy partnership expands solar funding",
        "Customer demand for bifacial panels surges in Sfax region",
        "Ministry of Energy announces new solar tender for 500MW",
        "JA Solar opens distribution center in Tunis",
        "Longi breaks efficiency record with new Hi-MO module",
        "Tunisia solar industry creates 12,000 new jobs in 2025",
        "Kairouan solar farm project receives $200M investment",
        "Review: Trina Vertex S+ outperforms in Saharan conditions",
        "Price drop alert: Canadian Solar 580W panels reduced 15%",
        "Customer review: Excellent performance from Jinko Tiger Neo",
        "New building code mandates solar readiness in Tunisia"
      ];

      function getTavilyHeadline() {
        return headlines[Math.floor(Math.random() * headlines.length)];
      }

      function newRows() {
        var rows = [];
        for (var x = 0; x < 50; x++) {
          var panel = SOLAR_PANELS[Math.floor(Math.random() * SOLAR_PANELS.length)];
          var region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
          var category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
          var supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
          var sentiment = SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)];
          var basePrice = 800 + Math.random() * 1200;
          var priceChange = Math.random() * 20 - 10;
          rows.push({
            panel, region, category, supplier,
            lastUpdate: new Date(),
            price_tnd: Math.round(basePrice * 100) / 100,
            chg: Math.round(priceChange * 100) / 100,
            bid: Math.round((basePrice - Math.random() * 50) * 100) / 100,
            ask: Math.round((basePrice + Math.random() * 50) * 100) / 100,
            volume: Math.floor(Math.random() * 200 + 10),
            rating: Math.round((3 + Math.random() * 2) * 10) / 10,
            sentiment,
            headline: getTavilyHeadline(),
            efficiency_pct: Math.round((18 + Math.random() * 5) * 10) / 10,
            warranty_years: [10, 12, 15, 20, 25][Math.floor(Math.random() * 5)],
          });
        }
        return rows;
      }

      async function init() {
        var allHosts = document.querySelectorAll("[data-solar-dashboard]");
        var host = allHosts[allHosts.length - 1];
        if (!host || !host.shadowRoot) return;
        var elem = host.shadowRoot.querySelector("perspective-viewer");
        if (!elem) return;

        await customElements.whenDefined("perspective-viewer");

        var worker = await perspective.worker();
        var table = await worker.table(newRows(), { name: "tunisia_solar_market", limit: 500 });
        await elem.load(worker);
        elem.restore({
          plugin: "Datagrid",
          columns_config: {
            "(+)chg": { fg_gradient: 7.93, number_fg_mode: "bar" },
            "(-)chg": { fg_gradient: 8.07, number_fg_mode: "bar" },
            chg: { bg_gradient: 9.97, number_bg_mode: "gradient" },
          },
          plugin_config: { editable: false, scroll_lock: true },
          settings: true,
          table: "tunisia_solar_market",
          theme: "Pro Light",
          group_by: ["panel"],
          split_by: ["region"],
          columns: ["(-)chg", "chg", "(+)chg", "price_tnd", "volume"],
          filter: [],
          sort: [["chg", "desc"]],
          expressions: {
            "(-)chg": 'if("chg"<0){"chg"}else{0}',
            "(+)chg": 'if("chg">0){"chg"}else{0}',
          },
          aggregates: {
            "(-)chg": "avg", chg: "avg", "(+)chg": "avg",
            price_tnd: "avg", volume: "sum", rating: "avg", efficiency_pct: "avg",
          },
        });

        (function postRow() {
          table.update(newRows());
          setTimeout(postRow, 10);
        })();
      }

      setTimeout(init, 500);
    `;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [showDashboard]);

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Navigation Bar - matching lexity-clone style */}
      <nav className="bg-[#F2EFEA] border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-[#2C2824] hover:text-[#C48C56] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-light tracking-wide">Back to Home</span>
          </a>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex text-[#C48C56]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" />
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span
              className="text-sm font-medium text-[#2C2824] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              TrintoSpec
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section - lexity-clone SaaS style */}
      <section className="relative py-24 overflow-hidden">
        {/* Background image with overlay - matching landing page hero style */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80"
            alt="Solar panels"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#F2EFEA]/90"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-[1px] bg-[#C48C56]/40"></div>
            <p
              className="text-xs uppercase tracking-[0.25em] text-[#C48C56] font-medium"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Real-Time AI Dashboard
            </p>
            <div className="w-12 h-[1px] bg-[#C48C56]/40"></div>
          </div>

          <h1
            className="text-5xl md:text-7xl tracking-tight mb-6 leading-tight text-[#2C2824] font-light"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tunisia Solar
            <br />
            Panel Market
          </h1>

          <div className="flex items-center justify-center gap-3 text-lg mb-8">
            <div className="w-8 h-[1px] bg-[#2C2824]/20"></div>
            <p
              className="text-[#2C2824]/60 font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Powered by Perspective.js and Tavily AI
            </p>
            <div className="w-8 h-[1px] bg-[#2C2824]/20"></div>
          </div>

          <p
            className="text-[#2C2824]/50 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Explore live streaming market data with real-time pricing, regional breakdowns,
            supplier analytics, and AI-curated news for the Tunisian solar energy sector.
          </p>

          {/* Feature pills - lexity-clone card style */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <div className="card-flashlight inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-black/5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span
                className="text-sm text-[#2C2824]/70 font-light"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Live Streaming Data
              </span>
            </div>
            <div className="card-flashlight inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-black/5">
              <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span
                className="text-sm text-[#2C2824]/70 font-light"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                9 Regions Tracked
              </span>
            </div>
            <div className="card-flashlight inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-black/5">
              <svg className="w-4 h-4 text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
              <span
                className="text-sm text-[#2C2824]/70 font-light"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                13 Panel Models
              </span>
            </div>
          </div>

          {!showDashboard && (
            <button
              onClick={() => setShowDashboard(true)}
              className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 hover:bg-[#C48C56] cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
              </svg>
              Launch Real-Time Dashboard
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {showDashboard && (
            <div className="relative inline-flex text-[#C48C56] mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <div className="sonar-ring"></div>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Section */}
      {showDashboard && (
        <section className="pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p
                  className="text-sm text-[#2C2824]/50 font-light tracking-wide"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Streaming live data
                </p>
              </div>
              <p
                className="text-xs text-[#2C2824]/30 uppercase tracking-widest"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Perspective.js + Tavily AI
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-black/5 shadow-xl shadow-black/5 bg-white">
              <div
                ref={containerRef}
                data-solar-dashboard="true"
                style={{ width: "100%", height: "80vh" }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer - matching lexity-clone */}
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
