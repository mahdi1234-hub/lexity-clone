"use client";

import React, { useState, useCallback, useMemo } from "react";

// Types for all Deck.gl layer configurations
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface LayerConfig {
  id: string;
  type: 
    | "scatterplot" | "arc" | "line" | "path" | "polygon" | "geojson"
    | "icon" | "text" | "column" | "point-cloud" | "bitmap"
    | "heatmap" | "hexagon" | "grid" | "screen-grid" | "contour"
    | "trip" | "great-circle" | "s2" | "h3-hexagon" | "h3-cluster"
    | "tile" | "terrain" | "mvt";
  visible?: boolean;
  opacity?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
}

export interface DeckGLMapConfig {
  viewState: MapViewState;
  layers: LayerConfig[];
  mapStyle?: string;
  title?: string;
  description?: string;
  controls?: {
    pitch?: boolean;
    bearing?: boolean;
    zoom?: boolean;
    fullscreen?: boolean;
  };
}

interface DeckGLMapProps {
  config: DeckGLMapConfig;
  onClose?: () => void;
  inline?: boolean;
}

const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  satellite: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

const LAYER_COLORS: Record<string, [number, number, number, number]> = {
  scatterplot: [196, 140, 86, 200],
  arc: [255, 140, 0, 180],
  line: [0, 128, 200, 180],
  path: [100, 200, 100, 180],
  polygon: [200, 100, 100, 120],
  geojson: [100, 150, 200, 150],
  icon: [255, 200, 0, 220],
  text: [255, 255, 255, 255],
  column: [196, 140, 86, 200],
  "point-cloud": [100, 200, 255, 200],
  heatmap: [255, 100, 50, 200],
  hexagon: [196, 140, 86, 200],
  grid: [150, 100, 200, 200],
  "screen-grid": [255, 100, 100, 200],
  contour: [0, 200, 200, 200],
  trip: [255, 200, 0, 255],
  "great-circle": [200, 50, 50, 180],
  h3: [100, 200, 100, 150],
  s2: [200, 150, 50, 150],
};

const FN = "'Plus Jakarta Sans', sans-serif";

// Pure CSS/SVG Map Renderer that works without WebGL dependencies
function PureMapRenderer({ config }: { config: DeckGLMapConfig }) {
  const { viewState, layers } = config;
  const [hoveredPoint, setHoveredPoint] = useState<{x: number; y: number; data: string} | null>(null);
  const [mapDimensions] = useState({ width: 800, height: 500 });

  // Convert lat/lng to pixel coordinates
  const project = useCallback((lng: number, lat: number) => {
    const scale = Math.pow(2, viewState.zoom) * 256 / (2 * Math.PI);
    const x = (lng - viewState.longitude) * (Math.PI / 180) * scale + mapDimensions.width / 2;
    const latRad = lat * Math.PI / 180;
    const viewLatRad = viewState.latitude * Math.PI / 180;
    const y = -(Math.log(Math.tan(Math.PI / 4 + latRad / 2)) - Math.log(Math.tan(Math.PI / 4 + viewLatRad / 2))) * scale + mapDimensions.height / 2;
    return { x, y };
  }, [viewState, mapDimensions]);

  // Render different layer types as SVG
  const renderLayer = useCallback((layer: LayerConfig) => {
    const color = LAYER_COLORS[layer.type] || [196, 140, 86, 200];
    const rgba = `rgba(${color[0]},${color[1]},${color[2]},${(layer.opacity ?? color[3] / 255)})`;
    const data = layer.data || [];

    switch (layer.type) {
      case "scatterplot": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const radius = d.radius || d.size || layer.config?.radiusScale || 6;
          return (
            <circle
              key={`${layer.id}-${i}`}
              cx={x} cy={y}
              r={Math.max(3, Math.min(radius, 20))}
              fill={rgba}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              className="transition-all duration-200 hover:opacity-80 cursor-pointer"
              onMouseEnter={() => setHoveredPoint({ x, y, data: d.name || d.label || `Point ${i+1}` })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        });
      }
      case "arc":
      case "great-circle": {
        return data.map((d, i) => {
          const source = d.source || d.from || d.sourcePosition;
          const target = d.target || d.to || d.targetPosition;
          if (!source || !target) return null;
          const s = project(source[0], source[1]);
          const t = project(target[0], target[1]);
          const midX = (s.x + t.x) / 2;
          const midY = Math.min(s.y, t.y) - Math.abs(s.x - t.x) * 0.3;
          return (
            <path
              key={`${layer.id}-${i}`}
              d={`M ${s.x} ${s.y} Q ${midX} ${midY} ${t.x} ${t.y}`}
              fill="none"
              stroke={d.color ? `rgba(${d.color[0]},${d.color[1]},${d.color[2]},0.7)` : rgba}
              strokeWidth={d.width || 2}
              className="transition-all duration-200"
            >
              <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
            </path>
          );
        });
      }
      case "line": {
        return data.map((d, i) => {
          const source = d.source || d.from || d.sourcePosition;
          const target = d.target || d.to || d.targetPosition;
          if (!source || !target) return null;
          const s = project(source[0], source[1]);
          const t = project(target[0], target[1]);
          return (
            <line
              key={`${layer.id}-${i}`}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={rgba} strokeWidth={d.width || 2}
            />
          );
        });
      }
      case "path":
      case "trip": {
        return data.map((d, i) => {
          const path = d.path || d.waypoints || d.coordinates || [];
          if (path.length < 2) return null;
          const points = path.map((p: number[]) => {
            const { x, y } = project(p[0], p[1]);
            return `${x},${y}`;
          }).join(" ");
          return (
            <g key={`${layer.id}-${i}`}>
              <polyline
                points={points}
                fill="none"
                stroke={rgba}
                strokeWidth={d.width || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={layer.type === "trip" ? "10 5" : "none"}
              >
                {layer.type === "trip" && (
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                )}
              </polyline>
            </g>
          );
        });
      }
      case "polygon":
      case "geojson": {
        return data.map((d, i) => {
          let coords = d.polygon || d.contour || d.coordinates;
          if (d.type === "Feature" && d.geometry) {
            coords = d.geometry.coordinates;
            if (d.geometry.type === "Polygon") coords = coords[0];
          }
          if (!coords || coords.length < 3) return null;
          const points = coords.map((p: number[]) => {
            const { x, y } = project(p[0], p[1]);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon
              key={`${layer.id}-${i}`}
              points={points}
              fill={rgba}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
              className="hover:opacity-80 cursor-pointer"
            />
          );
        });
      }
      case "icon": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const size = d.size || 24;
          return (
            <g key={`${layer.id}-${i}`} transform={`translate(${x - size/2}, ${y - size})`}>
              <path
                d={`M${size/2} ${size} C${size/2} ${size*0.6}, ${size} ${size*0.4}, ${size} ${size*0.3} C${size} 0, 0 0, 0 ${size*0.3} C0 ${size*0.4}, ${size/2} ${size*0.6}, ${size/2} ${size}Z`}
                fill={rgba}
                stroke="white"
                strokeWidth={1.5}
              />
              <circle cx={size/2} cy={size*0.3} r={size*0.15} fill="white" />
            </g>
          );
        });
      }
      case "text": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          return (
            <text
              key={`${layer.id}-${i}`}
              x={x} y={y}
              fill="white"
              fontSize={d.size || 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily={FN}
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {d.text || d.label || d.name || ""}
            </text>
          );
        });
      }
      case "column": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const height = Math.max(10, Math.min(d.elevation || d.height || d.value || 30, 150));
          const width = d.radius || 8;
          return (
            <g key={`${layer.id}-${i}`}>
              <rect
                x={x - width/2} y={y - height} width={width} height={height}
                fill={rgba}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={0.5}
                rx={2}
                className="hover:opacity-80 cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ x, y: y - height, data: d.name || `Value: ${d.value || height}` })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        });
      }
      case "heatmap": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const intensity = d.weight || d.intensity || d.value || 1;
          const r = Math.max(20, intensity * 15);
          return (
            <circle
              key={`${layer.id}-${i}`}
              cx={x} cy={y} r={r}
              fill={`radial-gradient(circle, rgba(255,100,0,${Math.min(0.6, intensity * 0.1)}) 0%, transparent 70%)`}
              style={{
                background: `radial-gradient(circle, rgba(255,100,0,0.6) 0%, transparent 70%)`,
                filter: "blur(8px)",
              }}
              opacity={Math.min(0.7, intensity * 0.15)}
            >
              <animate attributeName="r" values={`${r*0.9};${r*1.1};${r*0.9}`} dur="3s" repeatCount="indefinite" />
            </circle>
          );
        });
      }
      case "hexagon": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const size = d.radius || layer.config?.radius || 12;
          const hexPoints = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6;
            return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
          }).join(" ");
          const value = d.value || d.weight || d.count || 1;
          const hue = Math.max(0, Math.min(60, 60 - value * 6));
          return (
            <polygon
              key={`${layer.id}-${i}`}
              points={hexPoints}
              fill={`hsla(${hue}, 80%, 50%, 0.7)`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              className="hover:opacity-90 cursor-pointer"
              onMouseEnter={() => setHoveredPoint({ x, y, data: `Count: ${value}` })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        });
      }
      case "grid":
      case "screen-grid": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const cellSize = layer.config?.cellSize || 15;
          const value = d.value || d.weight || d.count || 1;
          const alpha = Math.min(0.9, value * 0.15);
          return (
            <rect
              key={`${layer.id}-${i}`}
              x={x - cellSize/2} y={y - cellSize/2}
              width={cellSize} height={cellSize}
              fill={`rgba(${color[0]},${color[1]},${color[2]},${alpha})`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
          );
        });
      }
      case "contour": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          const value = d.value || d.weight || 1;
          return (
            <circle
              key={`${layer.id}-${i}`}
              cx={x} cy={y}
              r={value * 8 + 10}
              fill="none"
              stroke={`rgba(0,200,200,${0.3 + value * 0.05})`}
              strokeWidth={2}
            />
          );
        });
      }
      case "point-cloud": {
        return data.map((d, i) => {
          const pos = d.position || d.coordinates || [d.longitude || d.lng, d.latitude || d.lat];
          if (!pos || pos.length < 2) return null;
          const { x, y } = project(pos[0], pos[1]);
          return (
            <circle
              key={`${layer.id}-${i}`}
              cx={x} cy={y} r={2}
              fill={rgba}
            />
          );
        });
      }
      default:
        return null;
    }
  }, [project, hoveredPoint]);

  // Create grid lines for the map background
  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const gridSpacing = 40;
    for (let x = 0; x < mapDimensions.width; x += gridSpacing) {
      lines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={mapDimensions.height} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />);
    }
    for (let y = 0; y < mapDimensions.height; y += gridSpacing) {
      lines.push(<line key={`h-${y}`} x1={0} y1={y} x2={mapDimensions.width} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />);
    }
    return lines;
  }, [mapDimensions]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#D5D0C8]/40" style={{ height: 500 }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      >
        {/* Grid background */}
        {gridLines}

        {/* Coastline-style decorative circles */}
        <circle cx={mapDimensions.width * 0.3} cy={mapDimensions.height * 0.6} r={80} fill="rgba(30,60,90,0.3)" stroke="rgba(100,150,200,0.1)" strokeWidth={1} />
        <circle cx={mapDimensions.width * 0.7} cy={mapDimensions.height * 0.4} r={60} fill="rgba(30,60,90,0.2)" stroke="rgba(100,150,200,0.1)" strokeWidth={1} />

        {/* Render all layers */}
        {layers.map((layer) => (
          <g key={layer.id} opacity={layer.visible === false ? 0 : 1}>
            {renderLayer(layer)}
          </g>
        ))}

        {/* Tooltip */}
        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x + 10} y={hoveredPoint.y - 30}
              width={Math.max(100, hoveredPoint.data.length * 8)} height={24}
              rx={6} fill="rgba(0,0,0,0.85)" stroke="rgba(255,255,255,0.2)" strokeWidth={1}
            />
            <text x={hoveredPoint.x + 16} y={hoveredPoint.y - 14} fill="white" fontSize={11} fontFamily={FN}>
              {hoveredPoint.data}
            </text>
          </g>
        )}
      </svg>

      {/* Map attribution & coordinates */}
      <div className="absolute bottom-2 left-2 text-[10px] text-white/50 bg-black/40 px-2 py-1 rounded" style={{ fontFamily: FN }}>
        {viewState.latitude.toFixed(4)}, {viewState.longitude.toFixed(4)} | Zoom: {viewState.zoom}
      </div>

      {/* Layer legend */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-2 max-w-[200px]">
        {layers.map((layer) => {
          const color = LAYER_COLORS[layer.type] || [196, 140, 86, 200];
          return (
            <div key={layer.id} className="flex items-center gap-2 py-0.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(${color[0]},${color[1]},${color[2]},0.8)` }} />
              <span className="text-[10px] text-white/80 truncate" style={{ fontFamily: FN }}>
                {layer.id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main DeckGLMap component
export default function DeckGLMap({ config, onClose, inline }: DeckGLMapProps) {
  const [activeStyle, setActiveStyle] = useState<string>(config.mapStyle || "dark");
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    config.layers.forEach(l => { vis[l.id] = l.visible !== false; });
    return vis;
  });
  const [showControls, setShowControls] = useState(false);

  const visibleLayers = useMemo(() => {
    return config.layers.map(l => ({
      ...l,
      visible: layerVisibility[l.id] !== false,
    }));
  }, [config.layers, layerVisibility]);

  const toggleLayer = (id: string) => {
    setLayerVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`relative ${inline ? "w-full" : "fixed inset-0 z-50 bg-[#F2EFEA]/95 backdrop-blur-sm flex items-center justify-center p-4"}`}>
      <div className={`${inline ? "w-full" : "w-full max-w-5xl"} bg-white/80 backdrop-blur-xl rounded-2xl border border-[#D5D0C8]/60 overflow-hidden shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D5D0C8]/40 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C48C56] to-[#8B6B3D] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: FN }}>
                {config.title || "Geospatial Visualization"}
              </h3>
              {config.description && (
                <p className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>{config.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Map style switcher */}
            <div className="flex bg-black/5 rounded-lg p-0.5">
              {Object.keys(MAP_STYLES).map((style) => (
                <button
                  key={style}
                  onClick={() => setActiveStyle(style)}
                  className={`px-2 py-1 text-[10px] rounded-md transition-all ${activeStyle === style ? "bg-[#C48C56] text-white" : "text-[#2C2824]/60 hover:text-[#2C2824]"}`}
                  style={{ fontFamily: FN }}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
            {/* Controls toggle */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <svg className="w-4 h-4 text-[#2C2824]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                <svg className="w-4 h-4 text-[#2C2824]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Map container */}
        <div className="relative">
          <PureMapRenderer config={{ ...config, layers: visibleLayers, mapStyle: activeStyle }} />
        </div>

        {/* Layer controls panel */}
        {showControls && (
          <div className="px-4 py-3 border-t border-[#D5D0C8]/40 bg-white/30">
            <p className="text-[10px] font-semibold text-[#2C2824]/60 uppercase tracking-wider mb-2" style={{ fontFamily: FN }}>
              Layers
            </p>
            <div className="flex flex-wrap gap-2">
              {config.layers.map((layer) => {
                const isVisible = layerVisibility[layer.id] !== false;
                const color = LAYER_COLORS[layer.type] || [196, 140, 86, 200];
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all border ${isVisible
                      ? "bg-[#C48C56]/10 border-[#C48C56]/30 text-[#2C2824]"
                      : "bg-black/5 border-transparent text-[#2C2824]/40"}`}
                    style={{ fontFamily: FN }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: isVisible ? `rgba(${color[0]},${color[1]},${color[2]},0.8)` : "rgba(0,0,0,0.2)" }}
                    />
                    {layer.type.replace(/-/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#D5D0C8]/40 bg-white/20">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#2C2824]/50" style={{ fontFamily: FN }}>
              {config.layers.length} layer{config.layers.length !== 1 ? "s" : ""} | {config.layers.reduce((sum, l) => sum + (l.data?.length || 0), 0)} data points
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#2C2824]/40" style={{ fontFamily: FN }}>
              Powered by Deck.gl
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
