"use client";

import { useEffect, useRef } from "react";

export default function SolarDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create an iframe-like sandbox using shadow DOM to isolate the dashboard
    const shadow = containerRef.current.attachShadow({ mode: "open" });

    // Build the full dashboard HTML
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100vh;
          background: #1a1a2e;
        }
        .dashboard-wrapper {
          width: 100%;
          height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .dashboard-header h1 {
          color: #fbbf24;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dashboard-header .badge {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .dashboard-header a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 14px;
          transition: color 0.2s;
        }
        .dashboard-header a:hover {
          color: #fff;
        }
        .viewer-container {
          flex: 1;
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
      <div class="dashboard-wrapper">
        <div class="dashboard-header">
          <h1>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
            TrintoSpec — Tunisia Solar Panel Market
            <span class="badge">Real-time AI</span>
          </h1>
          <a href="/">← Back to Home</a>
        </div>
        <div class="viewer-container">
          <perspective-viewer></perspective-viewer>
        </div>
      </div>
    `;

    // Load Perspective.js modules
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

      // Wait for the shadow DOM element
      async function init() {
        // Find the perspective-viewer in shadow DOM
        var allHosts = document.querySelectorAll("[data-solar-dashboard]");
        var host = allHosts[allHosts.length - 1];
        if (!host || !host.shadowRoot) return;
        var elem = host.shadowRoot.querySelector("perspective-viewer");
        if (!elem) return;

        // Wait for custom element to be defined
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

      // Small delay to ensure shadow DOM is ready
      setTimeout(init, 500);
    `;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-solar-dashboard="true"
      style={{ width: "100%", height: "100vh", background: "#1a1a2e" }}
    />
  );
}
