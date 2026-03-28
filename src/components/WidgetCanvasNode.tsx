"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import dynamic from "next/dynamic";

const ChartWidget = dynamic(() => import("./canvas-widgets/ChartWidget"), { ssr: false });
const NewsWidget = dynamic(() => import("./canvas-widgets/NewsWidget"), { ssr: false });
const LinkCardWidget = dynamic(() => import("./canvas-widgets/LinkCardWidget"), { ssr: false });
const ImageWidget = dynamic(() => import("./canvas-widgets/ImageWidget"), { ssr: false });
const GoogleWorkspaceWidget = dynamic(() => import("./canvas-widgets/GoogleWorkspaceWidget"), { ssr: false });
const FollowUpWidget = dynamic(() => import("./canvas-widgets/FollowUpWidget"), { ssr: false });

// Widget node types:
// - chart: Nivo chart (bar, line, pie, radar)
// - news: News/search results cards
// - link: Link preview card
// - image: Image gallery
// - gmail/calendar/tasks/meet: Google Workspace widgets
// - followup: Follow-up question suggestions

function WidgetCanvasNode({ data }: NodeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const widgetType = d.widgetType as string;

  const renderWidget = () => {
    switch (widgetType) {
      case "chart":
        return (
          <ChartWidget
            chartType={d.chartType || "bar"}
            title={d.title || "Chart"}
            description={d.description}
            data={d.chartData}
            config={d.chartConfig}
          />
        );

      case "news":
        return (
          <NewsWidget
            title={d.title || "News"}
            items={d.items || []}
            query={d.query}
          />
        );

      case "link":
        return (
          <LinkCardWidget
            title={d.title || "Link"}
            url={d.url || "#"}
            description={d.description}
            image={d.image}
            favicon={d.favicon}
            siteName={d.siteName}
          />
        );

      case "image":
        return (
          <ImageWidget
            title={d.title}
            images={d.images || []}
          />
        );

      case "gmail":
      case "calendar":
      case "tasks":
      case "meet":
        return (
          <GoogleWorkspaceWidget
            type={widgetType}
            title={d.title || widgetType}
            connected={d.connected || false}
            onConnect={d.onConnect}
            emails={d.emails}
            events={d.events}
            tasks={d.tasks}
            meetings={d.meetings}
          />
        );

      case "followup":
        return (
          <FollowUpWidget
            suggestions={d.suggestions || []}
            onSelect={d.onSelect || (() => {})}
          />
        );

      default:
        return (
          <div
            className="rounded-2xl border-2 border-[#3D3530] bg-gradient-to-br from-[#2C2824] to-[#1A1714] shadow-xl p-4"
            style={{ width: 340, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <p className="text-xs text-[#F2EFEA]/40">Unknown widget type: {widgetType}</p>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-[#C48C56] !w-3 !h-3 !border-2 !border-[#1A1714]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#C48C56] !w-3 !h-3 !border-2 !border-[#1A1714]" />
      {renderWidget()}
    </div>
  );
}

export default memo(WidgetCanvasNode);
