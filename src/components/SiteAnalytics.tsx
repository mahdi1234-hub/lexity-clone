"use client";

import React, { useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveStream } from "@nivo/stream";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

const FN = "'Plus Jakarta Sans', sans-serif";
const COLORS = ["#C48C56", "#E8976B", "#6B8E6B", "#7B9EA8", "#9B7BA8", "#D4A574", "#8B7355", "#A67B5B", "#5B8A72", "#B07A48"];

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
    container: { background: "#fff", color: "#2C2824", fontSize: 11, borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontFamily: FN, padding: "6px 10px" },
  },
};

export interface SiteAnalyticsData {
  location: { name: string; country: string; latitude: number; longitude: number; address?: string; };
  demographics?: {
    population: number;
    density: number;
    medianAge: number;
    growthRate: number;
    urbanization: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ageDistribution?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incomeDistribution?: any[];
  };
  climate?: {
    avgTemperature: number;
    avgRainfall: number;
    avgSunshine: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monthlyTemperature?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monthlyRainfall?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monthlySunshine?: any[];
    airQualityIndex?: number;
    windSpeed?: number;
    humidity?: number;
  };
  economy?: {
    gdpPerCapita: number;
    unemploymentRate: number;
    avgIncome: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sectorBreakdown?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    growthTrend?: any[];
    costOfLiving?: number;
  };
  infrastructure?: {
    transportScore: number;
    healthcareScore: number;
    educationScore: number;
    internetSpeed: number;
    greenSpacePercent: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scores?: any[];
  };
  energy?: {
    renewablePercent: number;
    solarPotential: number;
    windPotential: number;
    electricityPrice: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceBreakdown?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consumptionTrend?: any[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customCharts?: { type: string; title: string; description?: string; data: any; config?: Record<string, any> }[];
}

interface SiteAnalyticsProps {
  data: SiteAnalyticsData;
  onClose?: () => void;
  inline?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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

function KPICard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className="rounded-xl border border-[#D5D0C8]/40 bg-white/60 backdrop-blur-sm p-3">
      <p className="text-[9px] uppercase tracking-wider text-[#2C2824]/50 mb-1" style={{ fontFamily: FN }}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold" style={{ fontFamily: FN, color }}>{value}</span>
        {unit && <span className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>{unit}</span>}
      </div>
    </div>
  );
}

function renderCustomChart(chart: { type: string; title: string; description?: string; data: any; config?: Record<string, any> }) {
  const wide = chart.config?.wide;
  switch (chart.type) {
    case "bar":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveBar data={chart.data} keys={chart.config?.keys || ["value"]} indexBy={chart.config?.indexBy || "category"}
            margin={{ top: 10, right: 10, bottom: 50, left: 50 }} padding={0.3} colors={COLORS} theme={nivoTheme} borderRadius={4}
            axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
            animate motionConfig="gentle" />
        </ChartCard>
      );
    case "line":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveLine data={Array.isArray(chart.data) && chart.data[0]?.id ? chart.data : [{ id: "series", data: chart.data }]}
            margin={{ top: 10, right: 20, bottom: 50, left: 50 }} colors={COLORS} theme={nivoTheme}
            pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor={COLORS[0]}
            enableArea areaOpacity={0.08} curve="monotoneX"
            axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
            useMesh animate motionConfig="gentle" />
        </ChartCard>
      );
    case "pie":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsivePie data={chart.data}
            margin={{ top: 20, right: 60, bottom: 20, left: 60 }} innerRadius={0.55} padAngle={1.5} cornerRadius={5}
            colors={COLORS} theme={nivoTheme} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10}
            animate motionConfig="gentle" />
        </ChartCard>
      );
    case "radar":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveRadar data={chart.data} keys={chart.config?.keys || ["value"]} indexBy={chart.config?.indexBy || "metric"}
            maxValue="auto" margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
            colors={COLORS} theme={nivoTheme} gridLabelOffset={20}
            dotSize={7} dotColor="#fff" dotBorderWidth={2} dotBorderColor={{ from: "color" }}
            fillOpacity={0.2} animate motionConfig="gentle" />
        </ChartCard>
      );
    case "heatmap":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveHeatMap data={chart.data}
            margin={{ top: 30, right: 10, bottom: 50, left: 60 }} theme={nivoTheme}
            colors={{ type: "sequential", scheme: "oranges" }}
            axisTop={{ tickSize: 0, tickPadding: 5, tickRotation: -45 }} axisLeft={{ tickSize: 0, tickPadding: 5 }}
            borderRadius={3} borderWidth={1} borderColor="#fff" animate motionConfig="gentle" />
        </ChartCard>
      );
    case "sunburst":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveSunburst data={chart.data}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }} id="name" value="value"
            cornerRadius={4} borderWidth={2} borderColor="#fff" colors={COLORS} theme={nivoTheme}
            enableArcLabels arcLabelsSkipAngle={10} animate motionConfig="gentle" />
        </ChartCard>
      );
    case "treemap":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveTreeMap data={chart.data}
            identity="name" value="value" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            colors={COLORS} theme={nivoTheme} borderWidth={2} borderColor="#fff"
            labelSkipSize={32} animate motionConfig="gentle" innerPadding={3} />
        </ChartCard>
      );
    case "radial-bar":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveRadialBar data={chart.data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }} padding={0.4} cornerRadius={4}
            colors={COLORS} theme={nivoTheme} enableRadialGrid={false} animate motionConfig="gentle" />
        </ChartCard>
      );
    case "funnel":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveFunnel data={chart.data}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }} colors={COLORS} theme={nivoTheme}
            borderWidth={8} borderColor="#fff" borderOpacity={0.5} animate motionConfig="gentle" />
        </ChartCard>
      );
    case "calendar":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveCalendar data={chart.data}
            from={chart.config?.from || "2024-01-01"} to={chart.config?.to || "2024-12-31"}
            emptyColor="#F5F0EB" colors={["#E8C9A0", "#D4A574", "#C48C56", "#A67B5B", "#7A5C3E"]}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }} theme={nivoTheme}
            monthBorderColor="#fff" dayBorderWidth={2} dayBorderColor="#fff" />
        </ChartCard>
      );
    case "stream":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveStream data={chart.data} keys={chart.config?.keys || []}
            margin={{ top: 20, right: 80, bottom: 40, left: 50 }} colors={COLORS} theme={nivoTheme}
            fillOpacity={0.85} borderWidth={1} borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
            axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
            curve="basis" animate motionConfig="gentle" />
        </ChartCard>
      );
    case "scatter":
      return (
        <ChartCard title={chart.title} description={chart.description} wide={wide}>
          <ResponsiveScatterPlot data={Array.isArray(chart.data) && chart.data[0]?.id ? chart.data : [{ id: "data", data: chart.data }]}
            margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
            xScale={{ type: "linear", min: "auto", max: "auto" }} yScale={{ type: "linear", min: "auto", max: "auto" }}
            colors={COLORS} theme={nivoTheme} blendMode="multiply" nodeSize={8}
            axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
            animate motionConfig="gentle" />
        </ChartCard>
      );
    default:
      return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function SiteAnalytics({ data, onClose, inline }: SiteAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "climate" | "economy" | "infrastructure" | "energy">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", show: true },
    { id: "climate" as const, label: "Climate", show: !!data.climate },
    { id: "economy" as const, label: "Economy", show: !!data.economy },
    { id: "infrastructure" as const, label: "Infrastructure", show: !!data.infrastructure },
    { id: "energy" as const, label: "Energy", show: !!data.energy },
  ].filter(t => t.show);

  return (
    <div className={`${inline ? "w-full" : "fixed inset-0 z-50 bg-[#F2EFEA]/95 backdrop-blur-sm overflow-y-auto p-4"}`}>
      <div className={`${inline ? "w-full" : "max-w-6xl mx-auto"} bg-white/80 backdrop-blur-xl rounded-2xl border border-[#D5D0C8]/60 overflow-hidden shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D5D0C8]/40 bg-gradient-to-r from-[#7B9EA8]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B9EA8] to-[#5B8A72] flex items-center justify-center shadow-lg shadow-[#7B9EA8]/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: FN }}>
                Site Analytics: {data.location.name}
              </h3>
              <p className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>
                {data.location.country} | {data.location.latitude.toFixed(4)}°, {data.location.longitude.toFixed(4)}°
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${activeTab === tab.id ? "bg-[#7B9EA8] text-white" : "text-[#2C2824]/50 hover:bg-black/5"}`}
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
          {activeTab === "overview" && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                {data.demographics && (
                  <>
                    <KPICard label="Population" value={data.demographics.population >= 1000000 ? `${(data.demographics.population / 1000000).toFixed(1)}M` : `${(data.demographics.population / 1000).toFixed(0)}K`} color="#C48C56" />
                    <KPICard label="Density" value={data.demographics.density} unit="/km²" color="#E8976B" />
                  </>
                )}
                {data.climate && (
                  <>
                    <KPICard label="Avg Temp" value={data.climate.avgTemperature} unit="°C" color="#EF4444" />
                    <KPICard label="Sunshine" value={data.climate.avgSunshine} unit="hrs/yr" color="#F59E0B" />
                  </>
                )}
                {data.economy && (
                  <>
                    <KPICard label="GDP/Capita" value={`$${(data.economy.gdpPerCapita / 1000).toFixed(1)}k`} color="#10B981" />
                    <KPICard label="Unemployment" value={`${data.economy.unemploymentRate}%`} color="#3B82F6" />
                  </>
                )}
              </div>

              {/* Custom Charts */}
              {data.customCharts && data.customCharts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.customCharts.map((chart, i) => (
                    <React.Fragment key={i}>{renderCustomChart(chart)}</React.Fragment>
                  ))}
                </div>
              )}

              {/* Default charts if no custom charts */}
              {(!data.customCharts || data.customCharts.length === 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.demographics?.ageDistribution && (
                    <ChartCard title="Age Distribution" description="Population by age group">
                      <ResponsiveBar data={data.demographics.ageDistribution} keys={["value"]} indexBy="category"
                        margin={{ top: 10, right: 10, bottom: 40, left: 50 }} padding={0.3} colors={COLORS} theme={nivoTheme}
                        borderRadius={4} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                        animate motionConfig="gentle" />
                    </ChartCard>
                  )}
                  {data.climate?.monthlyTemperature && (
                    <ChartCard title="Monthly Temperature" description="Average temperature throughout the year">
                      <ResponsiveLine data={[{ id: "temp", data: data.climate.monthlyTemperature }]}
                        margin={{ top: 10, right: 20, bottom: 40, left: 50 }} colors={["#EF4444"]} theme={nivoTheme}
                        pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor="#EF4444"
                        enableArea areaOpacity={0.1} curve="monotoneX"
                        axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                        useMesh animate motionConfig="gentle" />
                    </ChartCard>
                  )}
                  {data.economy?.sectorBreakdown && (
                    <ChartCard title="Economic Sectors" description="GDP breakdown by sector">
                      <ResponsivePie data={data.economy.sectorBreakdown}
                        margin={{ top: 20, right: 60, bottom: 20, left: 60 }} innerRadius={0.55} padAngle={1.5} cornerRadius={5}
                        colors={COLORS} theme={nivoTheme} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10}
                        animate motionConfig="gentle" />
                    </ChartCard>
                  )}
                  {data.infrastructure?.scores && (
                    <ChartCard title="Infrastructure Scores" description="Quality of life indicators">
                      <ResponsiveRadar data={data.infrastructure.scores} keys={["value"]} indexBy="metric"
                        maxValue={100} margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                        colors={["#7B9EA8"]} theme={nivoTheme} gridLabelOffset={20}
                        dotSize={7} dotColor="#fff" dotBorderWidth={2} dotBorderColor="#7B9EA8"
                        fillOpacity={0.2} animate motionConfig="gentle" />
                    </ChartCard>
                  )}
                  {data.energy?.sourceBreakdown && (
                    <ChartCard title="Energy Sources" description="Power generation breakdown">
                      <ResponsiveSunburst data={{ name: "energy", children: data.energy.sourceBreakdown.map((s: { id?: string; label?: string; value: number }) => ({ name: s.id || s.label, value: s.value })) }}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }} id="name" value="value"
                        cornerRadius={4} borderWidth={2} borderColor="#fff" colors={COLORS} theme={nivoTheme}
                        enableArcLabels arcLabelsSkipAngle={10} animate motionConfig="gentle" />
                    </ChartCard>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "climate" && data.climate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-4 gap-3">
                <KPICard label="Avg Temperature" value={data.climate.avgTemperature} unit="°C" color="#EF4444" />
                <KPICard label="Annual Rainfall" value={data.climate.avgRainfall} unit="mm" color="#3B82F6" />
                <KPICard label="Sunshine Hours" value={data.climate.avgSunshine} unit="hrs/yr" color="#F59E0B" />
                <KPICard label="Air Quality" value={data.climate.airQualityIndex || "N/A"} unit="AQI" color="#10B981" />
              </div>
              {data.climate.monthlyTemperature && (
                <ChartCard title="Monthly Temperature" description="°C throughout the year">
                  <ResponsiveLine data={[{ id: "temp", data: data.climate.monthlyTemperature }]}
                    margin={{ top: 10, right: 20, bottom: 40, left: 50 }} colors={["#EF4444"]} theme={nivoTheme}
                    pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor="#EF4444"
                    enableArea areaOpacity={0.1} curve="monotoneX"
                    axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    useMesh animate motionConfig="gentle" />
                </ChartCard>
              )}
              {data.climate.monthlyRainfall && (
                <ChartCard title="Monthly Rainfall" description="mm of precipitation">
                  <ResponsiveBar data={data.climate.monthlyRainfall} keys={["value"]} indexBy="month"
                    margin={{ top: 10, right: 10, bottom: 40, left: 50 }} padding={0.3} colors={["#3B82F6"]} theme={nivoTheme}
                    borderRadius={4} axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    animate motionConfig="gentle" />
                </ChartCard>
              )}
            </div>
          )}

          {activeTab === "economy" && data.economy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-4 gap-3">
                <KPICard label="GDP per Capita" value={`$${(data.economy.gdpPerCapita / 1000).toFixed(1)}k`} color="#10B981" />
                <KPICard label="Avg Income" value={`$${(data.economy.avgIncome / 1000).toFixed(1)}k`} color="#C48C56" />
                <KPICard label="Unemployment" value={`${data.economy.unemploymentRate}%`} color="#EF4444" />
                <KPICard label="Cost of Living" value={data.economy.costOfLiving || "N/A"} unit="index" color="#8B5CF6" />
              </div>
              {data.economy.sectorBreakdown && (
                <ChartCard title="Economic Sectors" description="GDP by sector">
                  <ResponsivePie data={data.economy.sectorBreakdown}
                    margin={{ top: 20, right: 60, bottom: 20, left: 60 }} innerRadius={0.55} padAngle={1.5} cornerRadius={5}
                    colors={COLORS} theme={nivoTheme} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10}
                    animate motionConfig="gentle" />
                </ChartCard>
              )}
              {data.economy.growthTrend && (
                <ChartCard title="Economic Growth Trend" description="GDP growth over time">
                  <ResponsiveLine data={[{ id: "growth", data: data.economy.growthTrend }]}
                    margin={{ top: 10, right: 20, bottom: 40, left: 50 }} colors={["#10B981"]} theme={nivoTheme}
                    pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor="#10B981"
                    enableArea areaOpacity={0.1} curve="monotoneX"
                    axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    useMesh animate motionConfig="gentle" />
                </ChartCard>
              )}
            </div>
          )}

          {activeTab === "infrastructure" && data.infrastructure && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-5 gap-3">
                <KPICard label="Transport" value={data.infrastructure.transportScore} unit="/100" color="#3B82F6" />
                <KPICard label="Healthcare" value={data.infrastructure.healthcareScore} unit="/100" color="#EF4444" />
                <KPICard label="Education" value={data.infrastructure.educationScore} unit="/100" color="#8B5CF6" />
                <KPICard label="Internet" value={data.infrastructure.internetSpeed} unit="Mbps" color="#10B981" />
                <KPICard label="Green Space" value={`${data.infrastructure.greenSpacePercent}%`} color="#059669" />
              </div>
              {data.infrastructure.scores && (
                <ChartCard title="Infrastructure Radar" description="Quality scores by category" wide>
                  <ResponsiveRadar data={data.infrastructure.scores} keys={["value"]} indexBy="metric"
                    maxValue={100} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                    colors={["#7B9EA8"]} theme={nivoTheme} gridLabelOffset={24}
                    dotSize={8} dotColor="#fff" dotBorderWidth={2} dotBorderColor="#7B9EA8"
                    fillOpacity={0.2} animate motionConfig="gentle" />
                </ChartCard>
              )}
            </div>
          )}

          {activeTab === "energy" && data.energy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-4 gap-3">
                <KPICard label="Renewable %" value={`${data.energy.renewablePercent}%`} color="#10B981" />
                <KPICard label="Solar Potential" value={data.energy.solarPotential} unit="kWh/m²/yr" color="#F59E0B" />
                <KPICard label="Wind Potential" value={data.energy.windPotential} unit="m/s" color="#3B82F6" />
                <KPICard label="Electricity Price" value={`$${data.energy.electricityPrice}`} unit="/kWh" color="#C48C56" />
              </div>
              {data.energy.sourceBreakdown && (
                <ChartCard title="Energy Mix" description="Power generation by source">
                  <ResponsivePie data={data.energy.sourceBreakdown}
                    margin={{ top: 20, right: 60, bottom: 20, left: 60 }} innerRadius={0.55} padAngle={1.5} cornerRadius={5}
                    colors={COLORS} theme={nivoTheme} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10}
                    animate motionConfig="gentle" />
                </ChartCard>
              )}
              {data.energy.consumptionTrend && (
                <ChartCard title="Energy Consumption Trend" description="Historical usage pattern">
                  <ResponsiveLine data={[{ id: "consumption", data: data.energy.consumptionTrend }]}
                    margin={{ top: 10, right: 20, bottom: 40, left: 50 }} colors={["#F59E0B"]} theme={nivoTheme}
                    pointSize={6} pointColor="#fff" pointBorderWidth={2} pointBorderColor="#F59E0B"
                    enableArea areaOpacity={0.1} curve="monotoneX"
                    axisBottom={{ tickSize: 0, tickPadding: 8 }} axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    useMesh animate motionConfig="gentle" />
                </ChartCard>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#D5D0C8]/40 bg-white/20">
          <span className="text-[9px] text-[#2C2824]/40" style={{ fontFamily: FN }}>
            Site Analytics powered by AI
          </span>
        </div>
      </div>
    </div>
  );
}
