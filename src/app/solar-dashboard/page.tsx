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
        "Kairouan solar farm project receives investment boost",
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
      {/* Navigation - matching lexity-clone warm SaaS style */}
      <nav className="border-b border-[#d9d1c5] bg-[#f5f1ea] px-6 py-4">
        <div className="max-w-[1380px] mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-[#6f675f] hover:text-[#2F5D50] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] font-light tracking-wide">Back to Home</span>
          </a>
          <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2F5D50]"></span>
            TrintoSpec
          </div>
        </div>
      </nav>

      {/* Hero Section - Spatial Design Atelier philosophy style */}
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
                  {!showDashboard && (
                    <div className="pt-6">
                      <button
                        onClick={() => setShowDashboard(true)}
                        className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:bg-[#2F5D50] cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Launch Real-Time Dashboard
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  )}
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

      {/* Dashboard Section */}
      {showDashboard && (
        <section className="bg-[#F2EFEA] py-12 px-6">
          <div className="max-w-[1380px] mx-auto">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                <p
                  className="text-[13px] text-[#7a7268] font-light tracking-wide"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Streaming live data
                </p>
              </div>
              <p
                className="text-[10px] text-[#8a8178] uppercase tracking-[0.14em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Live
              </p>
            </div>
            <div className="overflow-hidden border border-[#d9d1c5] bg-white shadow-[0_14px_36px_rgba(23,18,14,0.06)]">
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
