// Shared render helpers (pure: no node:*, no DOM). Owned by the coordinator; see
// CHART_LIBRARY_PLAN.md §3 and §5.4. Type renderers build on these and never emit colors.
import type { TextFont } from "../layout/measure.ts";
import type { ChartSpec, ChartTone, Emphasis } from "../schema/index.ts";

export type ChartLocale = "es" | "en";
export type RenderOptions = { locale: ChartLocale };

/** Container widths each label decision must hold at (C8): the smallest width of each band. */
export const MIN_WIDTH = { narrow: 280, wide: 481 } as const;

/** Fonts of the label, value and tick roles (tokens --ds-type-label-* and --ds-type-caption-*). */
export const LABEL_FONT: TextFont = { family: "sans", weight: 400, size: 12 };
export const TICK_FONT: TextFont = { family: "sans", weight: 400, size: 12, letterSpacing: -0.24 };
export const LABEL_LINE_HEIGHT = 15;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A finite number as a short decimal, for coordinates and percentages in markup. */
export function num(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Chart coordinate must be finite");
  const rounded = Number(value.toFixed(3));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/** Inline position in % of the plot: the only inline style renderers may emit. */
export function placeStyle(box: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}): string {
  const parts: string[] = [];
  for (const key of ["left", "top", "width", "height"] as const) {
    const value = box[key];
    if (value !== undefined) parts.push(`${key}:${num(value)}%`);
  }
  return parts.join(";");
}

/** Series or category class by position: ig-chart__s1 … ig-chart__s6. */
export function seriesClass(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index > 5) {
    throw new Error("Charts color at most six series");
  }
  return `ig-chart__s${index + 1}`;
}

export function emphasisClass(emphasis: Emphasis): string {
  return emphasis === "highlight" ? "ig-chart__highlight" : "ig-chart__negative";
}

/** Fill class for an item: emphasis wins over its series or group color. */
export function fillClass(base: string, emphasis: Emphasis | undefined): string {
  return emphasis ? emphasisClass(emphasis) : base;
}

export function toneClass(tone: ChartTone): string {
  if (tone === "highlight" || tone === "negative" || tone === "neutral") {
    return `ig-chart__${tone}`;
  }
  return `ig-chart__s${tone.slice("data-".length)}`;
}

/** DOM ids of a chart; `instance` separates two uses of the same spec in one document. */
export function chartIds(spec: Pick<ChartSpec, "id">, instance = 0) {
  const base = instance === 0 ? `chart-${spec.id}` : `chart-${spec.id}-${instance}`;
  return { title: `${base}-title`, desc: `${base}-desc` };
}

export type TableData = {
  /** Header cells; the first one names the row label column. */
  head: string[];
  /** Body rows: the first cell is the row header. Plain text, escaped here. */
  rows: string[][];
};

/** Accessible data table, visually hidden (ig-chart__table). */
export function renderTable(caption: string, data: TableData): string {
  const head = data.head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("");
  const rows = data.rows
    .map(([first, ...rest]) => {
      const cells = rest.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("");
      return `<tr><th scope="row">${escapeHtml(first)}</th>${cells}</tr>`;
    })
    .join("");
  return [
    `<table class="ig-chart__table"><caption>${escapeHtml(caption)}</caption>`,
    `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`,
  ].join("");
}

export type LegendItem = { label: string; className: string; value?: string };

/** Legend: swatch + label (+ value). Classes set --chart-color through className. */
export function renderLegend(items: LegendItem[]): string {
  const entries = items
    .map((item) => {
      const value = item.value
        ? ` <span class="ig-chart__value">${escapeHtml(item.value)}</span>`
        : "";
      return [
        `<li class="ig-chart__legend-item ${item.className}">`,
        '<span class="ig-chart__swatch" aria-hidden="true"></span>',
        `${escapeHtml(item.label)}${value}</li>`,
      ].join("");
    })
    .join("");
  return `<ul class="ig-chart__legend">${entries}</ul>`;
}

/** "También: …" list for items that have no room inside the plot. */
export function renderAlso(heading: string, items: string[]): string {
  if (items.length === 0) return "";
  const entries = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<div class="ig-chart__also"><span>${escapeHtml(heading)}</span><ul>${entries}</ul></div>`;
}

export type FrameParts = {
  /** Plot, legend and "also" list: visible markup, already escaped by the type renderer. */
  body: string;
  table: TableData;
  instance?: number;
};

/**
 * Chart container. Title and description stay outside role="img" so they remain a heading and
 * a paragraph for assistive technology; the plot is one image labelled by both; the hidden
 * table carries the values.
 */
export function renderFrame(spec: ChartSpec, parts: FrameParts): string {
  const ids = chartIds(spec, parts.instance);
  const desc = spec.description
    ? `<p class="ig-chart__desc" id="${ids.desc}">${escapeHtml(spec.description)}</p>`
    : "";
  const labelledBy = spec.description ? `${ids.title} ${ids.desc}` : ids.title;
  const note = spec.note ? `<p class="ig-chart__note">${escapeHtml(spec.note)}</p>` : "";
  return [
    `<figure class="ig-chart ig-chart--${spec.type}">`,
    `<h3 class="ig-chart__title" id="${ids.title}">${escapeHtml(spec.title)}</h3>`,
    desc,
    `<div class="ig-chart__body" role="img" aria-labelledby="${labelledBy}">`,
    parts.body,
    "</div>",
    note,
    renderTable(spec.title, parts.table),
    "</figure>",
  ].join("");
}

const ALSO = { es: "También", en: "Also" } as const;
const OTHERS = { es: "Otros", en: "Others" } as const;
const PROJECTED = { es: "previsión", en: "projected" } as const;

/** Fixed UI words the renderers may need, per locale. */
export function words(locale: ChartLocale) {
  return { also: ALSO[locale], others: OTHERS[locale], projected: PROJECTED[locale] };
}

/** Thrown by a type whose renderer is not written yet; the report skips those types. */
export class NotImplementedError extends Error {
  constructor(type: string) {
    super(`Chart type not implemented yet: ${type}`);
    this.name = "NotImplementedError";
  }
}
