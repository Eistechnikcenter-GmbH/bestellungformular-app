import type { SourceSummary } from "./types";

export const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
  "#9333ea",
  "#ca8a04",
  "#e11d48",
  "#0284c7",
  "#059669",
];

export type PieSlice = SourceSummary & {
  color: string;
  percent: number;
  path: string;
  startAngle: number;
  endAngle: number;
};

export function buildPieSlices(data: SourceSummary[]): PieSlice[] {
  const positive = data.filter((d) => d.revenueTotal > 0);
  const total = positive.reduce((sum, d) => sum + d.revenueTotal, 0);
  if (total <= 0) return [];

  let cumulative = 0;
  return positive.map((item, index) => {
    const fraction = item.revenueTotal / total;
    const start = cumulative * 360;
    cumulative += fraction;
    const end = cumulative * 360;
    const largeArc = end - start > 180 ? 1 : 0;
    const startRad = ((start - 90) * Math.PI) / 180;
    const endRad = ((end - 90) * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const path =
      fraction >= 0.999
        ? "M 50 10 A 40 40 0 1 1 49.99 10 Z"
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      color,
      percent: fraction * 100,
      path,
      startAngle: startRad,
      endAngle: endRad,
    };
  });
}

/** Render pie chart to PNG data URL for PDF export. */
export function pieChartToDataUrl(slices: PieSlice[], size = 320): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;

  ctx.clearRect(0, 0, size, size);
  for (const slice of slices) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, slice.startAngle, slice.endAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  return canvas.toDataURL("image/png");
}
