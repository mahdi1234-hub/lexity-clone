"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIREIO_API = "https://fireio.vercel.app";

interface FeatureField {
  key: string;
  label: string;
  unit: string;
  defaultValue: number;
  group: string;
}

const FEATURE_FIELDS: FeatureField[] = [
  // Weather
  { key: "Angle du vent", label: "Wind Angle", unit: "deg", defaultValue: 178, group: "Weather" },
  { key: "Vitesse vent", label: "Wind Speed (local)", unit: "m/s", defaultValue: 0.4, group: "Weather" },
  { key: "Humidite ambiante", label: "Ambient Humidity", unit: "%", defaultValue: 80.5, group: "Weather" },
  { key: "Temperature ambiante", label: "Ambient Temperature", unit: "C", defaultValue: 6.2, group: "Weather" },
  { key: "Irradiation", label: "Solar Irradiation", unit: "W/m2", defaultValue: 133.0, group: "Weather" },
  { key: "Humidity", label: "Humidity (station)", unit: "%", defaultValue: 85.8, group: "Weather" },
  { key: "Temperature", label: "Temperature (station)", unit: "C", defaultValue: 5.12, group: "Weather" },
  { key: "Pressure", label: "Atmospheric Pressure", unit: "hPa", defaultValue: 1020, group: "Weather" },
  { key: "Visibility", label: "Visibility", unit: "km", defaultValue: 14.2, group: "Weather" },
  { key: "Weather Code", label: "Weather Code", unit: "", defaultValue: 3, group: "Weather" },
  { key: "Wind Bearing", label: "Wind Bearing", unit: "deg", defaultValue: 337, group: "Weather" },
  { key: "Wind Gust", label: "Wind Gust", unit: "km/h", defaultValue: 15.12, group: "Weather" },
  { key: "Wind Speed", label: "Wind Speed (station)", unit: "km/h", defaultValue: 5.4, group: "Weather" },
  // Air Quality
  { key: "Carbon monoxide", label: "Carbon Monoxide (CO)", unit: "ug/m3", defaultValue: 195.63, group: "Air Quality" },
  { key: "Dust", label: "Dust", unit: "ug/m3", defaultValue: 16, group: "Air Quality" },
  { key: "Nitrogen dioxide", label: "Nitrogen Dioxide (NO2)", unit: "ug/m3", defaultValue: 15.97, group: "Air Quality" },
  { key: "Ozone", label: "Ozone (O3)", unit: "ug/m3", defaultValue: 34.5, group: "Air Quality" },
  { key: "PM10", label: "PM10", unit: "ug/m3", defaultValue: 17, group: "Air Quality" },
  { key: "PM2.5", label: "PM2.5", unit: "ug/m3", defaultValue: 12, group: "Air Quality" },
  { key: "Sulphur dioxide", label: "Sulphur Dioxide (SO2)", unit: "ug/m3", defaultValue: 2.84, group: "Air Quality" },
  { key: "VOC", label: "VOC", unit: "ppb", defaultValue: 154.21, group: "Air Quality" },
  // Pollen
  { key: "alder_pollen", label: "Alder Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
  { key: "birch_pollen", label: "Birch Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
  { key: "grass_pollen", label: "Grass Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
  { key: "mugwort_pollen", label: "Mugwort Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
  { key: "olive_pollen", label: "Olive Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
  { key: "ragweed_pollen", label: "Ragweed Pollen", unit: "grains/m3", defaultValue: 0, group: "Pollen" },
];

const GROUP_ICONS: Record<string, string> = {
  Weather: "M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z",
  "Air Quality": "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
  Pollen: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
};

interface ForecastResult {
  ds: string;
  TimeGPT: number;
  [key: string]: unknown;
}

export default function ForecastPage() {
  const router = useRouter();
  const [timestamp, setTimestamp] = useState("2022-01-01 10:00:00");
  const [horizon, setHorizon] = useState(12);
  const [features, setFeatures] = useState<Record<string, number>>(
    Object.fromEntries(FEATURE_FIELDS.map((f) => [f.key, f.defaultValue]))
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult[] | null>(null);
  const [chartHtml, setChartHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("Weather");

  const groups = Array.from(new Set(FEATURE_FIELDS.map((f) => f.group)));

  const handleFeatureChange = (key: string, value: string) => {
    setFeatures((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const generateHistoricalData = () => {
    // Generate 200 rows of 30-min interval data cycling the submitted features
    // with small noise to create a realistic series
    const rows = [];
    const baseDate = new Date(timestamp);
    baseDate.setMinutes(0, 0, 0);
    baseDate.setDate(baseDate.getDate() - 4); // 4 days before

    for (let i = 0; i < 200; i++) {
      const dt = new Date(baseDate.getTime() + i * 30 * 60 * 1000);
      const hour = dt.getHours();
      // Simulate solar curve: irradiation peaks at noon, Y1t follows
      const solarFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
      const noise = 1 + (Math.random() - 0.5) * 0.06;

      const rowFeatures: Record<string, number> = {};
      for (const f of FEATURE_FIELDS) {
        let val = features[f.key];
        if (f.key === "Irradiation") {
          val = features[f.key] * solarFactor * noise;
        } else {
          val = val * (1 + (Math.random() - 0.5) * 0.04);
        }
        rowFeatures[f.key] = parseFloat(val.toFixed(4));
      }

      // Y1t correlates strongly with irradiation
      const y1t = parseFloat((solarFactor * 2.93 * noise + (Math.random() - 0.5) * 0.1).toFixed(4));

      rows.push({
        timestamp: dt.toISOString().replace("T", " ").slice(0, 19),
        value: y1t,
        features: rowFeatures,
      });
    }
    return rows;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setChartHtml(null);

    try {
      const historicalData = generateHistoricalData();

      // Fetch both forecast JSON and chart HTML in parallel
      const [forecastRes, chartRes] = await Promise.all([
        fetch(`${FIREIO_API}/forecast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: historicalData,
            horizon,
            freq: "30min",
            level: [80, 95],
            model: "timegpt-1",
          }),
        }),
        fetch(`${FIREIO_API}/forecast/chart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: historicalData,
            horizon,
            freq: "30min",
            level: [80, 95],
            model: "timegpt-1",
          }),
        }),
      ]);

      if (!forecastRes.ok) {
        const errData = await forecastRes.json();
        throw new Error(errData.detail || "Forecast request failed");
      }

      const forecastData = await forecastRes.json();
      setResult(forecastData.forecast);

      if (chartRes.ok) {
        const html = await chartRes.text();
        setChartHtml(html);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F2EFEA]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#2C2824] hover:text-[#C48C56] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#C48C56] animate-pulse" />
            <span className="text-sm text-[#2C2824]/60 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Powered by FireIO + TimeGPT
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C48C56]/10 text-[#C48C56] text-sm font-medium mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Solar Energy Forecasting
          </div>
          <h1
            className="text-4xl md:text-5xl tracking-tight text-[#2C2824] mb-4 font-light"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Predict Solar Panel Output
          </h1>
          <p className="text-[#2C2824]/60 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Enter your environmental sensor readings to forecast Y1t solar energy production
            using AI-powered time series analysis.
          </p>
        </div>

        {/* Settings Bar */}
        <div className="card-flashlight max-w-3xl mx-auto mb-8 p-6 rounded-2xl">
          <div className="relative z-10 flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-[#2C2824]/70 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Base Timestamp
              </label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F2EFEA] border border-black/10 text-[#2C2824] text-sm focus:outline-none focus:ring-2 focus:ring-[#C48C56]/30 focus:border-[#C48C56]/50 transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                placeholder="2022-01-01 10:00:00"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-[#2C2824]/70 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Horizon
              </label>
              <input
                type="number"
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value) || 12)}
                min={1}
                max={48}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F2EFEA] border border-black/10 text-[#2C2824] text-sm focus:outline-none focus:ring-2 focus:ring-[#C48C56]/30 focus:border-[#C48C56]/50 transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>
            <div className="text-xs text-[#2C2824]/40" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              30-min intervals
            </div>
          </div>
        </div>

        {/* Feature Group Tabs */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex gap-2 justify-center">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeGroup === group
                    ? "bg-[#2C2824] text-[#F2EFEA] shadow-lg"
                    : "bg-white/60 text-[#2C2824]/70 hover:bg-white/80 border border-black/5"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={GROUP_ICONS[group]} />
                </svg>
                {group}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGroup === group ? "bg-white/20" : "bg-black/5"}`}>
                  {FEATURE_FIELDS.filter((f) => f.group === group).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Fields */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="card-flashlight rounded-2xl p-6">
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURE_FIELDS.filter((f) => f.group === activeGroup).map((field) => (
                <div key={field.key} className="group">
                  <label
                    className="block text-xs font-medium text-[#2C2824]/60 mb-1.5 group-focus-within:text-[#C48C56] transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {field.label}
                    {field.unit && (
                      <span className="ml-1 text-[#2C2824]/30">({field.unit})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={features[field.key]}
                    onChange={(e) => handleFeatureChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F2EFEA] border border-black/8 text-[#2C2824] text-sm focus:outline-none focus:ring-2 focus:ring-[#C48C56]/30 focus:border-[#C48C56]/50 transition-all hover:border-black/15"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-10 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Forecasting with TimeGPT...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Generate Forecast
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div className="flex items-center gap-2 font-medium mb-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                Forecast Error
              </div>
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="max-w-5xl mx-auto mb-12">
            <h2
              className="text-2xl text-[#2C2824] mb-6 font-light text-center"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Forecast Results
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card-flashlight rounded-xl p-4">
                <div className="relative z-10">
                  <div className="text-xs text-[#2C2824]/50 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Points</div>
                  <div className="text-2xl font-light text-[#2C2824]" style={{ fontFamily: "'Instrument Serif', serif" }}>{result.length}</div>
                </div>
              </div>
              <div className="card-flashlight rounded-xl p-4">
                <div className="relative z-10">
                  <div className="text-xs text-[#2C2824]/50 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mean Y1t</div>
                  <div className="text-2xl font-light text-[#2C2824]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {(result.reduce((s, r) => s + r.TimeGPT, 0) / result.length).toFixed(3)}
                  </div>
                </div>
              </div>
              <div className="card-flashlight rounded-xl p-4">
                <div className="relative z-10">
                  <div className="text-xs text-[#2C2824]/50 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Min</div>
                  <div className="text-2xl font-light text-[#2C2824]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {Math.min(...result.map((r) => r.TimeGPT)).toFixed(3)}
                  </div>
                </div>
              </div>
              <div className="card-flashlight rounded-xl p-4">
                <div className="relative z-10">
                  <div className="text-xs text-[#2C2824]/50 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Max</div>
                  <div className="text-2xl font-light text-[#2C2824]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {Math.max(...result.map((r) => r.TimeGPT)).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Table */}
            <div className="card-flashlight rounded-2xl overflow-hidden mb-8">
              <div className="relative z-10 overflow-x-auto">
                <table className="w-full text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-left font-medium text-[#2C2824]/50">Timestamp</th>
                      <th className="px-4 py-3 text-right font-medium text-[#2C2824]/50">Y1t Forecast</th>
                      <th className="px-4 py-3 text-right font-medium text-[#2C2824]/50">CI 80% Low</th>
                      <th className="px-4 py-3 text-right font-medium text-[#2C2824]/50">CI 80% High</th>
                      <th className="px-4 py-3 text-right font-medium text-[#2C2824]/50">CI 95% Low</th>
                      <th className="px-4 py-3 text-right font-medium text-[#2C2824]/50">CI 95% High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row, i) => (
                      <tr key={i} className="border-b border-black/3 hover:bg-[#C48C56]/5 transition-colors">
                        <td className="px-4 py-2.5 text-[#2C2824]/70">{row.ds}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#2C2824]">
                          {row.TimeGPT.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#2C2824]/50">
                          {(row["TimeGPT-lo-80"] as number)?.toFixed(4) ?? "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#2C2824]/50">
                          {(row["TimeGPT-hi-80"] as number)?.toFixed(4) ?? "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#C48C56]/70">
                          {(row["TimeGPT-lo-95"] as number)?.toFixed(4) ?? "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#C48C56]/70">
                          {(row["TimeGPT-hi-95"] as number)?.toFixed(4) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartHtml && (
          <div className="max-w-6xl mx-auto mb-16">
            <h2
              className="text-2xl text-[#2C2824] mb-6 font-light text-center"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Interactive Forecast Chart
            </h2>
            <div className="card-flashlight rounded-2xl overflow-hidden">
              <div className="relative z-10">
                <iframe
                  srcDoc={chartHtml}
                  className="w-full border-0"
                  style={{ height: "700px" }}
                  title="Forecast Chart"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-[#2C2824]/40" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Forecasting powered by{" "}
            <a href="https://fireio.vercel.app/docs" target="_blank" rel="noopener noreferrer" className="text-[#C48C56] hover:underline">
              FireIO API
            </a>{" "}
            + Nixtla TimeGPT
          </p>
        </div>
      </footer>
    </div>
  );
}
