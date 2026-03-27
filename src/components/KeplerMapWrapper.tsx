"use client";

import React, { useState, useCallback } from "react";

const FN = "'Plus Jakarta Sans', sans-serif";

export interface KeplerFilter {
  field: string;
  type: "range" | "select" | "time";
  value: [number, number] | string[];
  domain?: [number, number] | string[];
}

export interface KeplerLayerConfig {
  id: string;
  type: "point" | "arc" | "line" | "grid" | "hexbin" | "heatmap" | "cluster" | "icon" | "polygon" | "trip" | "h3" | "s2" | "geojson";
  label: string;
  visible: boolean;
  color: [number, number, number];
  opacity: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
}

export interface KeplerMapConfig {
  title: string;
  description?: string;
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
  layers: KeplerLayerConfig[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any[]>;
  filters?: KeplerFilter[];
  mapStyle?: "dark" | "light" | "satellite" | "voyager";
  timePlayback?: {
    field: string;
    speed: number;
    interval: number;
    domain: [number, number];
  };
  interactions?: {
    tooltip?: boolean;
    brush?: boolean;
    geocoder?: boolean;
    coordinate?: boolean;
  };
  splitMap?: boolean;
}

interface KeplerMapWrapperProps {
  config: KeplerMapConfig;
  onClose?: () => void;
  inline?: boolean;
}

const KEPLER_LAYER_ICONS: Record<string, string> = {
  point: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  arc: "M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V4.5C3.06 5.19 1 8.34 1 11c0 4.42 3.58 8 8 8v-3c-1.1 0-2-.9-2-2zm10 0c0 1.1-.9 2-2 2v3c4.42 0 8-3.58 8-8 0-2.66-1.06-5.81-4-6.5v3.67c1.16.42 2 1.52 2 2.83z",
  line: "M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8.5-4-4L2 18z",
  grid: "M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z",
  hexbin: "M12 2l-5.5 3v6L12 14l5.5-3V5z",
  heatmap: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
  cluster: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm0-8h2v6h-2z",
  icon: "M12 2l-5.5 3v6L12 14l5.5-3V5z",
  polygon: "M3 5l4-2 5 3 5-3 4 2v12l-4 2-5-3-5 3-4-2z",
  trip: "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5z",
  h3: "M12 2l-5.5 3v6L12 14l5.5-3V5z",
  s2: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  geojson: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
};

function KeplerLayerPanel({ layers, onToggle }: {
  layers: KeplerLayerConfig[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {layers.map((layer) => (
        <div key={layer.id} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${layer.visible ? "bg-white/10" : "opacity-50"}`}>
          <button
            onClick={() => onToggle(layer.id)}
            className="flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={layer.visible ? `rgb(${layer.color.join(",")})` : "rgba(255,255,255,0.3)"}>
              <path d={KEPLER_LAYER_ICONS[layer.type] || KEPLER_LAYER_ICONS.point} />
            </svg>
          </button>
          <span className="text-[10px] text-white/80 flex-1 truncate" style={{ fontFamily: FN }}>
            {layer.label}
          </span>
          <span className="text-[9px] text-white/40 uppercase" style={{ fontFamily: FN }}>
            {layer.type}
          </span>
        </div>
      ))}
    </div>
  );
}

function KeplerFilterPanel({ filters, onFilterChange }: {
  filters: KeplerFilter[];
  onFilterChange: (index: number, value: [number, number] | string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {filters.map((filter, idx) => (
        <div key={idx} className="space-y-1">
          <label className="text-[10px] text-white/60 uppercase tracking-wider" style={{ fontFamily: FN }}>
            {filter.field}
          </label>
          {filter.type === "range" && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={(filter.domain as [number, number])?.[0] || 0}
                max={(filter.domain as [number, number])?.[1] || 100}
                value={(filter.value as [number, number])[0]}
                onChange={(e) => onFilterChange(idx, [Number(e.target.value), (filter.value as [number, number])[1]])}
                className="flex-1 h-1 accent-[#C48C56]"
              />
              <span className="text-[10px] text-white/60 min-w-[40px] text-right" style={{ fontFamily: FN }}>
                {(filter.value as [number, number])[0]} - {(filter.value as [number, number])[1]}
              </span>
            </div>
          )}
          {filter.type === "select" && (
            <div className="flex flex-wrap gap-1">
              {(filter.domain as string[] || []).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    const current = filter.value as string[];
                    const newVal = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt];
                    onFilterChange(idx, newVal);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] transition-all ${
                    (filter.value as string[]).includes(opt) ? "bg-[#C48C56] text-white" : "bg-white/10 text-white/50"
                  }`}
                  style={{ fontFamily: FN }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TimePlaybackBar({ config, isPlaying, currentTime, onPlay, onTimeChange }: {
  config: KeplerMapConfig["timePlayback"];
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onTimeChange: (time: number) => void;
}) {
  if (!config) return null;
  const { domain, speed } = config;
  const progress = ((currentTime - domain[0]) / (domain[1] - domain[0])) * 100;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] max-w-lg bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
      <div className="flex items-center gap-3">
        <button onClick={onPlay} className="text-white/80 hover:text-white transition-colors">
          {isPlaying ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="flex-1 relative">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#C48C56] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range"
            min={domain[0]} max={domain[1]}
            value={currentTime}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[10px] text-white/60 min-w-[30px]" style={{ fontFamily: FN }}>
          {speed}x
        </span>
        <span className="text-[10px] text-white/50" style={{ fontFamily: FN }}>
          {new Date(currentTime).toLocaleDateString()}
        </span>
      </div>
      {/* Distribution bars */}
      <div className="flex items-end gap-px mt-2 h-6">
        {Array.from({ length: 40 }, (_, i) => {
          const height = Math.random() * 100;
          const isActive = (i / 40) * 100 <= progress;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${height}%`,
                backgroundColor: isActive ? "rgba(196,140,86,0.6)" : "rgba(255,255,255,0.1)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// SVG Map Renderer for Kepler-style visualization
function KeplerSVGMap({ config, layers }: { config: KeplerMapConfig; layers: KeplerLayerConfig[] }) {
  const { viewState, data } = config;
  const [hoveredPoint, setHoveredPoint] = useState<{x: number; y: number; info: string} | null>(null);
  const width = 800;
  const height = 500;

  const project = useCallback((lng: number, lat: number) => {
    const scale = Math.pow(2, viewState.zoom) * 256 / (2 * Math.PI);
    const x = (lng - viewState.longitude) * (Math.PI / 180) * scale + width / 2;
    const latRad = lat * Math.PI / 180;
    const viewLatRad = viewState.latitude * Math.PI / 180;
    const y = -(Math.log(Math.tan(Math.PI / 4 + latRad / 2)) - Math.log(Math.tan(Math.PI / 4 + viewLatRad / 2))) * scale + height / 2;
    return { x, y };
  }, [viewState]);

  const renderKeplerLayer = useCallback((layer: KeplerLayerConfig) => {
    if (!layer.visible) return null;
    const layerData = data[layer.id] || [];
    const rgb = layer.color;
    const rgba = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${layer.opacity})`;

    switch (layer.type) {
      case "point":
      case "icon":
      case "cluster": {
        return layerData.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos?.length) return null;
          const { x, y } = project(pos[0], pos[1]);
          const r = d.radius || d.size || 5;
          return (
            <g key={`${layer.id}-${i}`}>
              <circle cx={x} cy={y} r={r + 3} fill={rgba} opacity={0.2} />
              <circle cx={x} cy={y} r={r} fill={rgba} stroke="rgba(255,255,255,0.4)" strokeWidth={1}
                className="cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoveredPoint({ x, y, info: d.name || d.label || `${pos[1].toFixed(2)}, ${pos[0].toFixed(2)}` })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        });
      }
      case "arc": {
        return layerData.map((d, i) => {
          const s = d.source || d.from || d.sourcePosition;
          const t = d.target || d.to || d.targetPosition;
          if (!s || !t) return null;
          const sp = project(s[0], s[1]);
          const tp = project(t[0], t[1]);
          const mx = (sp.x + tp.x) / 2;
          const my = Math.min(sp.y, tp.y) - Math.abs(sp.x - tp.x) * 0.25;
          return (
            <path key={`${layer.id}-${i}`}
              d={`M ${sp.x} ${sp.y} Q ${mx} ${my} ${tp.x} ${tp.y}`}
              fill="none" stroke={rgba} strokeWidth={d.width || 2} opacity={0.7}
              strokeDasharray="6 3">
              <animate attributeName="stroke-dashoffset" from="50" to="0" dur="2s" repeatCount="indefinite" />
            </path>
          );
        });
      }
      case "line": {
        return layerData.map((d, i) => {
          const s = d.source || d.from || d.sourcePosition;
          const t = d.target || d.to || d.targetPosition;
          if (!s || !t) return null;
          const sp = project(s[0], s[1]);
          const tp = project(t[0], t[1]);
          return <line key={`${layer.id}-${i}`} x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y} stroke={rgba} strokeWidth={d.width || 2} />;
        });
      }
      case "hexbin": {
        return layerData.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos?.length) return null;
          const { x, y } = project(pos[0], pos[1]);
          const size = d.radius || 12;
          const value = d.value || d.count || 1;
          const hexPoints = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6;
            return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon key={`${layer.id}-${i}`} points={hexPoints}
              fill={`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(0.9, value * 0.1 + 0.2)})`}
              stroke="rgba(255,255,255,0.2)" strokeWidth={1}
              className="cursor-pointer hover:opacity-80"
              onMouseEnter={() => setHoveredPoint({ x, y, info: `Count: ${value}` })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        });
      }
      case "grid": {
        return layerData.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos?.length) return null;
          const { x, y } = project(pos[0], pos[1]);
          const cs = layer.config?.cellSize || 14;
          const value = d.value || d.count || 1;
          return (
            <rect key={`${layer.id}-${i}`}
              x={x - cs/2} y={y - cs/2} width={cs} height={cs}
              fill={`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(0.9, value * 0.1 + 0.2)})`}
              stroke="rgba(255,255,255,0.1)" strokeWidth={0.5}
            />
          );
        });
      }
      case "heatmap": {
        return layerData.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos?.length) return null;
          const { x, y } = project(pos[0], pos[1]);
          const intensity = d.weight || d.intensity || d.value || 1;
          const r = Math.max(15, intensity * 12);
          return (
            <circle key={`${layer.id}-${i}`} cx={x} cy={y} r={r}
              fill={`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(0.5, intensity * 0.08)})`}
              style={{ filter: "blur(6px)" }}>
              <animate attributeName="r" values={`${r*0.95};${r*1.05};${r*0.95}`} dur="4s" repeatCount="indefinite" />
            </circle>
          );
        });
      }
      case "polygon":
      case "geojson": {
        return layerData.map((d, i) => {
          let coords = d.polygon || d.contour || d.coordinates;
          if (d.type === "Feature" && d.geometry) {
            coords = d.geometry.coordinates;
            if (d.geometry.type === "Polygon") coords = coords[0];
          }
          if (!coords?.length) return null;
          const points = coords.map((p: number[]) => {
            const { x, y } = project(p[0], p[1]);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon key={`${layer.id}-${i}`} points={points}
              fill={`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.3)`}
              stroke={rgba} strokeWidth={1.5}
            />
          );
        });
      }
      case "trip": {
        return layerData.map((d, i) => {
          const path = d.path || d.waypoints || d.coordinates || [];
          if (path.length < 2) return null;
          const points = path.map((p: number[]) => {
            const { x, y } = project(p[0], p[1]);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polyline key={`${layer.id}-${i}`} points={points}
              fill="none" stroke={rgba} strokeWidth={3}
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="8 4">
              <animate attributeName="stroke-dashoffset" from="60" to="0" dur="3s" repeatCount="indefinite" />
            </polyline>
          );
        });
      }
      default:
        return null;
    }
  }, [data, project]);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
      style={{ background: config.mapStyle === "light" ? "linear-gradient(135deg, #e8e4df 0%, #d5d0c8 100%)" : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      {/* Grid */}
      {Array.from({ length: 20 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <line x1={i * 40} y1={0} x2={i * 40} y2={height} stroke={config.mapStyle === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} />
          <line x1={0} y1={i * 40} x2={width} y2={i * 40} stroke={config.mapStyle === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} />
        </React.Fragment>
      ))}

      {/* Layers */}
      {layers.map((layer) => (
        <g key={layer.id}>{renderKeplerLayer(layer)}</g>
      ))}

      {/* Tooltip */}
      {hoveredPoint && (
        <g>
          <rect x={hoveredPoint.x + 8} y={hoveredPoint.y - 28} width={Math.max(90, hoveredPoint.info.length * 7)} height={22}
            rx={5} fill="rgba(0,0,0,0.85)" stroke="rgba(255,255,255,0.15)" />
          <text x={hoveredPoint.x + 14} y={hoveredPoint.y - 13} fill="white" fontSize={10} fontFamily={FN}>
            {hoveredPoint.info}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function KeplerMapWrapper({ config, onClose, inline }: KeplerMapWrapperProps) {
  const [activePanel, setActivePanel] = useState<"layers" | "filters" | "interactions" | null>("layers");
  const [layers, setLayers] = useState<KeplerLayerConfig[]>(config.layers);
  const [filters, setFilters] = useState<KeplerFilter[]>(config.filters || []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(config.timePlayback?.domain[0] || 0);
  const [mapStyle, setMapStyle] = useState<"dark" | "light" | "satellite" | "voyager">(config.mapStyle || "dark");

  const toggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const changeLayerColor = useCallback((id: string, color: [number, number, number]) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, color } : l));
  }, []);

  const handleFilterChange = useCallback((index: number, value: [number, number] | string[]) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, value } : f));
  }, []);

  return (
    <div className={`relative ${inline ? "w-full" : "fixed inset-0 z-50 bg-[#F2EFEA]/95 backdrop-blur-sm flex items-center justify-center p-4"}`}>
      <div className={`${inline ? "w-full" : "w-full max-w-6xl"} bg-[#242730] rounded-2xl overflow-hidden shadow-2xl border border-white/10`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#29323c]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#5ce0d2] to-[#3b9b8f] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-sm text-white/90 font-medium" style={{ fontFamily: FN }}>
              {config.title}
            </span>
            {config.description && (
              <span className="text-[10px] text-white/40 ml-2" style={{ fontFamily: FN }}>
                {config.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Map style buttons */}
            {(["dark", "light", "satellite", "voyager"] as const).map((style) => (
              <button key={style} onClick={() => setMapStyle(style)}
                className={`px-2 py-1 text-[9px] rounded transition-all ${mapStyle === style ? "bg-[#5ce0d2] text-[#242730]" : "text-white/50 hover:text-white/80"}`}
                style={{ fontFamily: FN }}>
                {style}
              </button>
            ))}
            {onClose && (
              <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex">
          {/* Side panel */}
          <div className="w-64 bg-[#29323c] border-r border-white/5 flex flex-col max-h-[500px]">
            {/* Panel tabs */}
            <div className="flex border-b border-white/5">
              {(["layers", "filters", "interactions"] as const).map((tab) => (
                <button key={tab} onClick={() => setActivePanel(activePanel === tab ? null : tab)}
                  className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider transition-all ${activePanel === tab ? "text-[#5ce0d2] border-b-2 border-[#5ce0d2]" : "text-white/40 hover:text-white/60"}`}
                  style={{ fontFamily: FN }}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {activePanel === "layers" && (
                <KeplerLayerPanel layers={layers} onToggle={toggleLayer} />
              )}
              {activePanel === "filters" && (
                filters.length > 0 ? (
                  <KeplerFilterPanel filters={filters} onFilterChange={handleFilterChange} />
                ) : (
                  <p className="text-[10px] text-white/30 text-center mt-4" style={{ fontFamily: FN }}>No filters configured</p>
                )
              )}
              {activePanel === "interactions" && (
                <div className="space-y-3">
                  {[
                    { label: "Tooltip", enabled: config.interactions?.tooltip !== false },
                    { label: "Brush", enabled: config.interactions?.brush || false },
                    { label: "Geocoder", enabled: config.interactions?.geocoder || false },
                    { label: "Coordinate", enabled: config.interactions?.coordinate || false },
                  ].map((interaction) => (
                    <div key={interaction.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60" style={{ fontFamily: FN }}>{interaction.label}</span>
                      <div className={`w-8 h-4 rounded-full transition-all ${interaction.enabled ? "bg-[#5ce0d2]" : "bg-white/10"}`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-all mt-0.5 ${interaction.enabled ? "ml-4.5" : "ml-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data summary */}
            <div className="p-3 border-t border-white/5">
              <p className="text-[9px] text-white/30" style={{ fontFamily: FN }}>
                {layers.length} layers | {Object.values(config.data).reduce((s, d) => s + d.length, 0)} features
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative" style={{ height: 500 }}>
            <KeplerSVGMap config={{ ...config, mapStyle }} layers={layers} />

            {/* Time playback */}
            {config.timePlayback && (
              <TimePlaybackBar
                config={config.timePlayback}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlay={() => setIsPlaying(!isPlaying)}
                onTimeChange={setCurrentTime}
              />
            )}

            {/* Coordinates display */}
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[9px] text-white/50" style={{ fontFamily: FN }}>
              {config.viewState.latitude.toFixed(4)}, {config.viewState.longitude.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#29323c] border-t border-white/5">
          <span className="text-[9px] text-white/30" style={{ fontFamily: FN }}>Powered by Kepler.gl</span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-white/30" style={{ fontFamily: FN }}>
              Zoom: {config.viewState.zoom} | Pitch: {config.viewState.pitch || 0}° | Bearing: {config.viewState.bearing || 0}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
