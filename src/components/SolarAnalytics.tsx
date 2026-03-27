"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveFunnel } from "@nivo/funnel";

const FN = "'Plus Jakarta Sans', sans-serif";
const SOLAR_COLORS = ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#06B6D4"];

const nivoTheme = {
  background: "transparent",
  text: { fontSize: 10, fill: "#2C2824", fontFamily: FN },
  axis: {
    domain: { line: { stroke: "#2C282444", strokeWidth: 1 } },
    legend: { text: { fontSize: 10, fill: "#2C2824", fontFamily: FN } },
    ticks: { line: { stroke: "#2C282433", strokeWidth: 1 }, text: { fontSize: 9, fill: "#2C282499", fontFamily: FN } },
  },
  grid: { line: { stroke: "#D5D0C8", strokeWidth: 1, strokeDasharray: "4 4" } },
  legends: { text: { fontSize: 9, fill: "#2C2824", fontFamily: FN } },
  labels: { text: { fontSize: 9, fill: "#2C2824", fontFamily: FN } },
  tooltip: {
    container: {
      background: "#fff", color: "#2C2824", fontSize: 11, borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontFamily: FN, padding: "6px 10px",
    },
  },
};

export interface SolarPanelConfig {
  count: number;
  wattage: number;
  efficiency: number;
  tilt: number;
  azimuth: number;
  degradationRate: number;
  costPerPanel: number;
  installationCost: number;
}

export interface BuildingSolarData {
  location: { latitude: number; longitude: number; address: string; country: string };
  building: {
    roofArea: number;
    roofType: string;
    roofTilt: number;
    orientation: string;
    stories: number;
    yearBuilt?: number;
  };
  solar: {
    annualIrradiance: number;
    peakSunHours: number;
    monthlyIrradiance: number[];
    optimalTilt: number;
    optimalAzimuth: number;
    shadingFactor: number;
    annualFlux: number;
    monthlyFlux: number[];
  };
  panels: SolarPanelConfig;
  financial: {
    electricityRate: number;
    feedInTariff: number;
    netMetering: boolean;
    incentives: number;
    annualSavings: number;
    paybackYears: number;
    roi: number;
    lifetimeSavings: number;
    costWithSolar: number;
    costWithoutSolar: number;
    breakEvenYear: number;
  };
  environmental: {
    co2Offset: number;
    treesEquivalent: number;
    carsRemoved: number;
    homesEquivalent: number;
  };
  energyProduction: {
    annualKwh: number;
    monthlyKwh: number[];
    dailyAvgKwh: number;
    selfConsumption: number;
    gridExport: number;
  };
  hourlyShade?: { hour: number; coverage: number }[];
  panelLayout?: { x: number; y: number; width: number; height: number; active: boolean }[];
}

interface SolarAnalyticsProps {
  data: BuildingSolarData;
  onClose?: () => void;
  inline?: boolean;
}

function KPICard({ label, value, unit, icon, color, trend }: {
  label: string; value: string | number; unit?: string; icon: React.ReactNode; color: string; trend?: string;
}) {
  return (
    <div className="relative rounded-xl border border-[#D5D0C8]/40 bg-white/60 backdrop-blur-sm p-3 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#2C2824]/50 mb-1" style={{ fontFamily: FN }}>{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold" style={{ fontFamily: FN, color }}>{value}</span>
            {unit && <span className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>{unit}</span>}
          </div>
          {trend && <p className="text-[9px] mt-0.5 text-emerald-600" style={{ fontFamily: FN }}>{trend}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children, wide }: { title: string; description?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#D5D0C8]/40 bg-white/60 backdrop-blur-sm p-4 hover:shadow-md transition-all ${wide ? "col-span-2" : ""}`} style={{ minHeight: 300 }}>
      <div className="mb-2">
        <h4 className="text-xs font-semibold text-[#2C2824] uppercase tracking-wider" style={{ fontFamily: FN }}>{title}</h4>
        {description && <p className="text-[9px] text-[#2C2824]/50 mt-0.5" style={{ fontFamily: FN }}>{description}</p>}
      </div>
      <div style={{ height: 240 }}>{children}</div>
    </div>
  );
}

// Roof Panel Layout Visualization
function RoofPanelLayout({ panels, roofArea }: { panels: SolarPanelConfig; roofArea: number }) {
  const panelCount = panels.count;
  const cols = Math.ceil(Math.sqrt(panelCount * 1.6));
  const rows = Math.ceil(panelCount / cols);
  const cellW = 100 / (cols + 1);
  const cellH = 100 / (rows + 1);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#8B7355]/20 to-[#A67B5B]/10 rounded-lg overflow-hidden border border-[#D5D0C8]/40">
      {/* Roof outline */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,2 98,30 98,98 2,98 2,30" fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.4" />
        {/* Panel grid */}
        {Array.from({ length: panelCount }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = (col + 0.5) * cellW + cellW * 0.3;
          const y = (row + 0.5) * cellH + 30;
          if (y + cellH > 96) return null;
          return (
            <g key={i}>
              <rect x={x} y={y} width={cellW * 0.8} height={cellH * 0.85}
                fill="#1e3a5f" stroke="#2d5a8e" strokeWidth="0.3" rx="0.5" opacity="0.85" />
              <line x1={x + cellW * 0.4} y1={y} x2={x + cellW * 0.4} y2={y + cellH * 0.85}
                stroke="#2d5a8e" strokeWidth="0.15" />
              <line x1={x} y1={y + cellH * 0.425} x2={x + cellW * 0.8} y2={y + cellH * 0.425}
                stroke="#2d5a8e" strokeWidth="0.15" />
            </g>
          );
        })}
        {/* Sun rays */}
        <circle cx="85" cy="8" r="5" fill="#F59E0B" opacity="0.6" />
        {[0, 30, 60, 90, 120, 150].map((angle, i) => (
          <line key={i} x1={85 + 7 * Math.cos(angle * Math.PI / 180)} y1={8 + 7 * Math.sin(angle * Math.PI / 180)}
            x2={85 + 10 * Math.cos(angle * Math.PI / 180)} y2={8 + 10 * Math.sin(angle * Math.PI / 180)}
            stroke="#F59E0B" strokeWidth="0.4" opacity="0.4" />
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 text-[9px] text-[#2C2824]/50" style={{ fontFamily: FN }}>
        {panelCount} panels | {roofArea} m² roof area
      </div>
    </div>
  );
}

export default function SolarAnalytics({ data, onClose, inline }: SolarAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "energy" | "financial" | "environmental" | "shading">("overview");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Monthly energy production chart data
  const monthlyEnergyData = useMemo(() => data.energyProduction.monthlyKwh.map((kwh, i) => ({
    month: months[i], production: Math.round(kwh),
  })), [data]);

  // Monthly irradiance line data
  const monthlyIrradianceData = useMemo(() => [{
    id: "irradiance",
    data: data.solar.monthlyIrradiance.map((val, i) => ({ x: months[i], y: Math.round(val) })),
  }], [data]);

  // Energy breakdown pie
  const energyBreakdownData = useMemo(() => [
    { id: "Self Consumption", label: "Self Consumption", value: Math.round(data.energyProduction.selfConsumption) },
    { id: "Grid Export", label: "Grid Export", value: Math.round(data.energyProduction.gridExport) },
  ], [data]);

  // Financial comparison
  const financialCompareData = useMemo(() => {
    const years: { year: string; withSolar: number; withoutSolar: number }[] = [];
    for (let y = 0; y <= 20; y++) {
      const withoutSolar = Math.round(data.financial.electricityRate * data.energyProduction.annualKwh * (1 + 0.03) ** y);
      const degradation = (1 - data.panels.degradationRate / 100) ** y;
      const solarSavings = Math.round(data.financial.annualSavings * degradation);
      const withSolar = Math.round(withoutSolar - solarSavings);
      years.push({ year: `${2024 + y}`, withSolar: Math.max(0, withSolar), withoutSolar });
    }
    return years;
  }, [data]);

  // Financial cumulative line
  const cumulativeFinancialData = useMemo(() => {
    let cumWithSolar = data.panels.count * data.panels.costPerPanel + data.panels.installationCost;
    let cumWithoutSolar = 0;
    return [{
      id: "With Solar",
      data: financialCompareData.map((d, i) => {
        if (i > 0) cumWithSolar += d.withSolar;
        return { x: d.year, y: cumWithSolar };
      }),
    }, {
      id: "Without Solar",
      data: financialCompareData.map((d) => {
        cumWithoutSolar += d.withoutSolar;
        return { x: d.year, y: cumWithoutSolar };
      }),
    }];
  }, [financialCompareData, data]);

  // Environmental radar
  const environmentalRadarData = useMemo(() => [
    { metric: "CO2 Offset", value: Math.min(100, data.environmental.co2Offset / 50 * 100) },
    { metric: "Trees Equiv.", value: Math.min(100, data.environmental.treesEquivalent / 100 * 100) },
    { metric: "Cars Removed", value: Math.min(100, data.environmental.carsRemoved / 5 * 100) },
    { metric: "Homes Equiv.", value: Math.min(100, data.environmental.homesEquivalent * 100) },
    { metric: "Grid Savings", value: Math.min(100, data.energyProduction.gridExport / data.energyProduction.annualKwh * 100) },
  ], [data]);

  // Monthly flux heatmap
  const monthlyFluxHeatmap = useMemo(() => {
    return months.map((month, i) => ({
      id: month,
      data: Array.from({ length: 12 }, (_, h) => ({
        x: `${h + 6}:00`,
        y: Math.round(data.solar.monthlyFlux[i] * (Math.sin((h / 11) * Math.PI) * 0.8 + 0.2) * (Math.random() * 0.3 + 0.85)),
      })),
    }));
  }, [data]);

  // Hourly shade data
  const hourlyShadeData = useMemo(() => {
    return (data.hourlyShade || Array.from({ length: 14 }, (_, i) => ({
      hour: i + 6,
      coverage: Math.max(0, Math.min(100, 100 - Math.sin(((i) / 13) * Math.PI) * 80 + Math.random() * 15)),
    }))).map(d => ({ hour: `${d.hour}:00`, coverage: Math.round(d.coverage) }));
  }, [data]);

  // Panel degradation funnel
  const degradationFunnelData = useMemo(() => {
    return [1, 5, 10, 15, 20, 25].map(year => {
      const factor = (1 - data.panels.degradationRate / 100) ** year;
      return {
        id: `Year ${year}`,
        label: `Year ${year}`,
        value: Math.round(data.energyProduction.annualKwh * factor),
      };
    });
  }, [data]);

  // Radial bar for efficiency metrics
  const efficiencyRadialData = useMemo(() => [
    { id: "Panel Eff.", data: [{ x: "efficiency", y: data.panels.efficiency }] },
    { id: "Shading", data: [{ x: "shading", y: (1 - data.solar.shadingFactor) * 100 }] },
    { id: "Self Use", data: [{ x: "self-use", y: (data.energyProduction.selfConsumption / data.energyProduction.annualKwh) * 100 }] },
  ], [data]);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "energy" as const, label: "Energy" },
    { id: "financial" as const, label: "Financial" },
    { id: "environmental" as const, label: "Environmental" },
    { id: "shading" as const, label: "Shading & Layout" },
  ];

  return (
    <div className={`${inline ? "w-full" : "fixed inset-0 z-50 bg-[#F2EFEA]/95 backdrop-blur-sm overflow-y-auto p-4"}`}>
      <div className={`${inline ? "w-full" : "max-w-6xl mx-auto"} bg-white/80 backdrop-blur-xl rounded-2xl border border-[#D5D0C8]/60 overflow-hidden shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D5D0C8]/40 bg-gradient-to-r from-[#F59E0B]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shadow-lg shadow-[#F59E0B]/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: FN }}>Solar Potential Analysis</h3>
              <p className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>
                {data.location.address} | {data.building.roofArea}m² {data.building.roofType} roof
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${activeTab === tab.id ? "bg-[#F59E0B] text-white shadow-sm" : "text-[#2C2824]/50 hover:text-[#2C2824] hover:bg-black/5"}`}
                style={{ fontFamily: FN }}>
                {tab.label}
              </button>
            ))}
            {onClose && (
              <button onClick={onClose} className="ml-2 p-1.5 rounded-lg hover:bg-black/5">
                <svg className="w-4 h-4 text-[#2C2824]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* KPI Row - always visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <KPICard label="Annual Production" value={`${(data.energyProduction.annualKwh / 1000).toFixed(1)}`} unit="MWh/yr"
              color="#F59E0B" trend={`${data.energyProduction.dailyAvgKwh.toFixed(1)} kWh/day avg`}
              icon={<svg className="w-4 h-4" style={{ color: "#F59E0B" }} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>} />
            <KPICard label="Solar Panels" value={data.panels.count} unit={`x ${data.panels.wattage}W`}
              color="#3B82F6"
              icon={<svg className="w-4 h-4" style={{ color: "#3B82F6" }} viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>} />
            <KPICard label="Annual Savings" value={`$${data.financial.annualSavings.toLocaleString()}`}
              color="#10B981" trend={`${data.financial.roi.toFixed(1)}% ROI`}
              icon={<svg className="w-4 h-4" style={{ color: "#10B981" }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>} />
            <KPICard label="Payback Period" value={data.financial.paybackYears} unit="years"
              color="#8B5CF6"
              icon={<svg className="w-4 h-4" style={{ color: "#8B5CF6" }} viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>} />
            <KPICard label="CO2 Offset" value={data.environmental.co2Offset.toFixed(1)} unit="tons/yr"
              color="#059669"
              icon={<svg className="w-4 h-4" style={{ color: "#059669" }} viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" /></svg>} />
            <KPICard label="Peak Sun Hours" value={data.solar.peakSunHours.toFixed(1)} unit="hrs/day"
              color="#F59E0B"
              icon={<svg className="w-4 h-4" style={{ color: "#F59E0B" }} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>} />
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Monthly Energy Production" description="kWh produced per month">
                <ResponsiveBar data={monthlyEnergyData} keys={["production"]} indexBy="month"
                  margin={{ top: 10, right: 10, bottom: 40, left: 50 }} padding={0.3}
                  colors={["#F59E0B"]} theme={nivoTheme} borderRadius={4}
                  axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  animate={true} motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Solar Irradiance Trend" description="Monthly kWh/m² received">
                <ResponsiveLine data={monthlyIrradianceData}
                  margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
                  colors={["#EF4444"]} theme={nivoTheme}
                  pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor="#EF4444"
                  enableArea areaOpacity={0.1} curve="monotoneX"
                  axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  useMesh animate motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Energy Breakdown" description="Self-consumption vs grid export">
                <ResponsivePie data={energyBreakdownData}
                  margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
                  innerRadius={0.6} padAngle={2} cornerRadius={5}
                  colors={["#10B981", "#3B82F6"]} theme={nivoTheme}
                  arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10}
                  animate motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Panel Efficiency Metrics" description="System performance indicators">
                <ResponsiveRadialBar data={efficiencyRadialData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  padding={0.4} cornerRadius={4}
                  colors={SOLAR_COLORS} theme={nivoTheme}
                  enableRadialGrid={false}
                  radialAxisStart={{ tickSize: 0, tickPadding: 5 }}
                  circularAxisOuter={{ tickSize: 0, tickPadding: 8 }}
                  animate motionConfig="gentle" />
              </ChartCard>
            </div>
          )}

          {activeTab === "energy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Monthly Energy Production" description="kWh produced each month" wide>
                <ResponsiveBar data={monthlyEnergyData} keys={["production"]} indexBy="month"
                  margin={{ top: 10, right: 10, bottom: 40, left: 50 }} padding={0.3}
                  colors={["#F59E0B"]} theme={nivoTheme} borderRadius={4}
                  axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  animate motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Solar Flux Heatmap" description="Monthly solar flux by hour of day">
                <ResponsiveHeatMap data={monthlyFluxHeatmap}
                  margin={{ top: 30, right: 10, bottom: 30, left: 50 }}
                  colors={{ type: "sequential", scheme: "oranges" }} theme={nivoTheme}
                  axisTop={{ tickSize: 0, tickPadding: 5, tickRotation: -45 }}
                  axisLeft={{ tickSize: 0, tickPadding: 5 }}
                  borderRadius={3} borderWidth={1} borderColor="#fff"
                  animate motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Production Degradation Over 25 Years" description="Expected output decline">
                <ResponsiveFunnel data={degradationFunnelData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  colors={SOLAR_COLORS} theme={nivoTheme}
                  borderWidth={8} borderColor="#fff" borderOpacity={0.5}
                  labelColor={{ from: "color", modifiers: [["darker", 3]] }}
                  animate motionConfig="gentle" />
              </ChartCard>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cost comparison summary */}
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-600/60 mb-1" style={{ fontFamily: FN }}>Cost with Solar (20yr)</p>
                  <p className="text-2xl font-semibold text-emerald-700" style={{ fontFamily: FN }}>${(data.financial.costWithSolar / 1000).toFixed(1)}k</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <p className="text-[9px] uppercase tracking-wider text-red-600/60 mb-1" style={{ fontFamily: FN }}>Cost without Solar (20yr)</p>
                  <p className="text-2xl font-semibold text-red-700" style={{ fontFamily: FN }}>${(data.financial.costWithoutSolar / 1000).toFixed(1)}k</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-[9px] uppercase tracking-wider text-blue-600/60 mb-1" style={{ fontFamily: FN }}>Total Savings</p>
                  <p className="text-2xl font-semibold text-blue-700" style={{ fontFamily: FN }}>${(data.financial.lifetimeSavings / 1000).toFixed(1)}k</p>
                  <p className="text-[9px] text-blue-500 mt-0.5" style={{ fontFamily: FN }}>Break even: {data.financial.breakEvenYear}</p>
                </div>
              </div>
              <ChartCard title="Cumulative Cost Comparison" description="With vs without solar over 20 years" wide>
                <ResponsiveLine data={cumulativeFinancialData}
                  margin={{ top: 10, right: 80, bottom: 40, left: 60 }}
                  colors={["#10B981", "#EF4444"]} theme={nivoTheme}
                  pointSize={0} enableArea areaOpacity={0.05} curve="monotoneX"
                  axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8, format: v => `$${(v as number / 1000).toFixed(0)}k` }}
                  legends={[{ anchor: "bottom-right", direction: "column", translateX: 80, itemWidth: 70, itemHeight: 20, symbolSize: 10, symbolShape: "circle" }]}
                  useMesh animate motionConfig="gentle" />
              </ChartCard>
            </div>
          )}

          {activeTab === "environmental" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Environmental Impact Radar" description="Normalized impact scores">
                <ResponsiveRadar data={environmentalRadarData} keys={["value"]} indexBy="metric"
                  maxValue={100} margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                  colors={["#059669"]} theme={nivoTheme}
                  gridLabelOffset={20} dotSize={8} dotColor="#fff" dotBorderWidth={2} dotBorderColor="#059669"
                  fillOpacity={0.2} animate motionConfig="gentle" />
              </ChartCard>
              <div className="space-y-3">
                {[
                  { label: "CO2 Offset", value: `${data.environmental.co2Offset.toFixed(1)} tons/year`, desc: "Carbon dioxide prevented from entering the atmosphere", icon: "leaf", color: "#059669" },
                  { label: "Trees Equivalent", value: `${data.environmental.treesEquivalent} trees`, desc: "Number of mature trees needed to absorb same CO2", icon: "tree", color: "#10B981" },
                  { label: "Cars Removed", value: `${data.environmental.carsRemoved.toFixed(1)} cars`, desc: "Equivalent cars taken off the road for one year", icon: "car", color: "#3B82F6" },
                  { label: "Homes Powered", value: `${data.environmental.homesEquivalent.toFixed(2)} homes`, desc: "Average homes that could be powered by this system", icon: "home", color: "#8B5CF6" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-[#D5D0C8]/40 bg-white/60 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + "15" }}>
                      <span className="text-lg">
                        {item.icon === "leaf" ? "🌿" : item.icon === "tree" ? "🌳" : item.icon === "car" ? "🚗" : "🏠"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#2C2824]" style={{ fontFamily: FN }}>{item.label}</span>
                        <span className="text-sm font-semibold" style={{ fontFamily: FN, color: item.color }}>{item.value}</span>
                      </div>
                      <p className="text-[9px] text-[#2C2824]/50 mt-0.5" style={{ fontFamily: FN }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "shading" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Hourly Shade Coverage" description="Percentage of roof shaded throughout the day">
                <ResponsiveBar data={hourlyShadeData} keys={["coverage"]} indexBy="hour"
                  margin={{ top: 10, right: 10, bottom: 40, left: 50 }} padding={0.3}
                  colors={(d) => {
                    const val = d.data.coverage as number;
                    return val > 60 ? "#EF4444" : val > 30 ? "#F59E0B" : "#10B981";
                  }}
                  theme={nivoTheme} borderRadius={4}
                  axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  animate motionConfig="gentle" />
              </ChartCard>
              <ChartCard title="Panel Layout" description="Optimized panel arrangement on roof">
                <RoofPanelLayout panels={data.panels} roofArea={data.building.roofArea} />
              </ChartCard>
              <ChartCard title="Optimal Configuration" wide>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full items-center">
                  {[
                    { label: "Optimal Tilt", value: `${data.solar.optimalTilt}°`, desc: "Panel angle from horizontal" },
                    { label: "Optimal Azimuth", value: `${data.solar.optimalAzimuth}°`, desc: "Panel compass direction" },
                    { label: "Shading Factor", value: `${(data.solar.shadingFactor * 100).toFixed(0)}%`, desc: "Shade impact on production" },
                    { label: "Annual Flux", value: `${data.solar.annualFlux.toFixed(0)} kWh/m²`, desc: "Total solar energy received" },
                    { label: "Panel Efficiency", value: `${data.panels.efficiency}%`, desc: "Conversion rate" },
                    { label: "Panel Wattage", value: `${data.panels.wattage}W`, desc: "Peak output per panel" },
                    { label: "System Size", value: `${(data.panels.count * data.panels.wattage / 1000).toFixed(1)} kW`, desc: "Total system capacity" },
                    { label: "Roof Type", value: data.building.roofType, desc: data.building.orientation },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/10">
                      <p className="text-[9px] uppercase tracking-wider text-[#2C2824]/50" style={{ fontFamily: FN }}>{item.label}</p>
                      <p className="text-lg font-semibold text-[#2C2824] mt-1" style={{ fontFamily: FN }}>{item.value}</p>
                      <p className="text-[8px] text-[#2C2824]/40 mt-0.5" style={{ fontFamily: FN }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#D5D0C8]/40 bg-white/20">
          <span className="text-[9px] text-[#2C2824]/40" style={{ fontFamily: FN }}>
            Solar analysis inspired by make.solar & Radiance (useradiance.com)
          </span>
          <span className="text-[9px] text-[#2C2824]/40" style={{ fontFamily: FN }}>
            {data.location.latitude.toFixed(4)}°, {data.location.longitude.toFixed(4)}°
          </span>
        </div>
      </div>
    </div>
  );
}
