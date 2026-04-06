declare module "frappe-charts" {
  interface ChartOptions {
    title?: string;
    data: {
      labels: string[];
      datasets: Array<{
        name: string;
        values: number[];
        chartType?: string;
      }>;
    };
    type?: "line" | "bar" | "percentage" | "pie" | "heatmap";
    height?: number;
    colors?: string[];
    barOptions?: {
      stacked?: boolean;
      spaceRatio?: number;
    };
    lineOptions?: {
      dotSize?: number;
      regionFill?: number;
      hideDots?: boolean;
      hideLine?: boolean;
      heatline?: boolean;
      spline?: boolean;
    };
    axisOptions?: {
      xAxisMode?: string;
      yAxisMode?: string;
      xIsSeries?: boolean;
    };
    tooltipOptions?: {
      formatTooltipX?: (d: string) => string;
      formatTooltipY?: (d: number) => string;
    };
    isNavigable?: boolean;
    maxSlices?: number;
    valuesOverPoints?: boolean;
  }

  export class Chart {
    constructor(container: HTMLElement | null, options: ChartOptions);
    update(data: any): void;
    export(): void;
    destroy(): void;
  }
}
