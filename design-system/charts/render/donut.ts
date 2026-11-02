import type { DonutSpec } from "../schema/index.ts";
import { formatValue } from "../format.ts";
import {
  escapeHtml, fillClass, num, renderFrame, seriesClass, type RenderOptions,
} from "./shared.ts";

function point(radius: number, angle: number): string {
  const radians = (angle - 90) * Math.PI / 180;
  return `${num(50 + radius * Math.cos(radians))} ${num(50 + radius * Math.sin(radians))}`;
}

export function renderDonut(spec: DonutSpec, options: RenderOptions): string {
  const { locale } = options;
  const max = Math.max(...spec.parts.map((part) => part.value));
  const sum = spec.parts.reduce((total, part) => total + part.value / max, 0);
  const ratios = spec.parts.map((part) => part.value / max / sum);
  // Highlighted areas keep an eight-pixel inner edge after the gap.
  const minimum = spec.parts.map((part) => part.emphasis === "highlight" ? 10 : 3);
  const small = ratios.map((ratio, i) => ratio * 360 < minimum[i]);
  const reserved = minimum.reduce((total, angle, i) => total + (small[i] ? angle : 0), 0);
  const remaining = ratios.reduce((total, ratio, i) => total + (small[i] ? 0 : ratio), 0);
  let start = 0;
  const arcs = spec.parts.map((part, i) => {
    const angle = small[i] ? minimum[i] : ratios[i] / remaining * (360 - reserved);
    const end = start + angle;
    const large = angle > 180 ? 1 : 0;
    const d = `M ${point(46, start)} A 46 46 0 ${large} 1 ${point(46, end)}`
      + ` L ${point(29, end)} A 29 29 0 ${large} 0 ${point(29, start)} Z`;
    start = end;
    return `<path class="ig-chart__donut-sector ${fillClass(seriesClass(i), part.emphasis)}"`
      + ` data-part="${i}" data-angle="${num(angle)}" d="${d}"/>`;
  }).join("");
  const rows = spec.parts.map((part, i) => [
    part.label, formatValue(part.value, locale, spec.unit),
    formatValue(ratios[i] * 100, locale, { kind: "percent", decimals: 1 }),
  ]);
  const legend = rows.map(([label, value, percent], i) => {
    const color = fillClass(seriesClass(i), spec.parts[i].emphasis);
    return `<li class="ig-chart__donut-item ${color}">`
      + '<span class="ig-chart__swatch" aria-hidden="true"></span>'
      + `<span class="ig-chart__donut-detail"><span>${escapeHtml(label)}</span>`
      + `<span>${escapeHtml(value)} · ${escapeHtml(percent)}</span></span></li>`;
  }).join("");
  const total = spec.total?.value ?? spec.parts.reduce((total, part) => total + part.value, 0);
  const totalLabel = spec.total
    ? `<span class="ig-chart__donut-total-label">${escapeHtml(spec.total.label)}</span>` : "";
  const center = `<div class="ig-chart__donut-total">${totalLabel}`
    + `<span>${escapeHtml(formatValue(total, locale, spec.unit))}</span></div>`;
  const body = '<div class="ig-chart__donut-layout"><div class="ig-chart__donut-ring">'
    + `<svg class="ig-chart__donut-svg" viewBox="0 0 100 100" aria-hidden="true">`
    + `${arcs}</svg>${center}</div><ul class="ig-chart__donut-legend">${legend}</ul></div>`;
  if (spec.total) rows.push([spec.total.label, formatValue(total, locale, spec.unit), ""]);
  return renderFrame(spec, {
    instance: options.instance,
    body,
    table: {
      head: locale === "es" ? ["Parte", "Valor", "Porcentaje"] : ["Part", "Value", "Percent"],
      rows,
    },
  });
}
