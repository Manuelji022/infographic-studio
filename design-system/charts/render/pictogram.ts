import type { PictogramSpec } from "../schema/index.ts";
import { formatValue } from "../format.ts";
import {
  chartIds, escapeHtml, num, placeStyle, renderFrame, type RenderOptions,
} from "./shared.ts";

const PERSON = 'M10 0a3 3 0 1 1 0 6a3 3 0 0 1 0-6M5 8h10l3 8h-4v8h-3v-8H9v8H6v-8H2Z';

export function renderPictogram(spec: PictogramSpec, options: RenderOptions): string {
  const { locale } = options;
  const ids = chartIds(spec, options.instance);
  const shape = spec.icon === "person" ? `<path d="${PERSON}"/>`
    : spec.icon === "square" ? '<rect x="0" y="2" width="20" height="20" stroke-width="1"/>'
      : '<circle cx="10" cy="12" r="10" stroke-width="1"/>';
  const symbol = `<svg class="ig-chart__pictogram-symbol" aria-hidden="true">`
    + `<symbol id="${ids.icon}" viewBox="0 0 20 24">${shape}</symbol></svg>`;
  const use = `<use href="#${ids.icon}"/>`;
  const icons = Array.from({ length: spec.of }, (_, i) => {
    const fill = Math.min(1, Math.max(0, spec.value - i)) * 100;
    if (fill === 0 || fill === 100) {
      return `<svg data-icon="${i}" data-fill="${num(fill)}">${use}</svg>`;
    }
    return `<span class="ig-chart__pictogram-icon" data-icon="${i}" data-fill="${num(fill)}">`
      + `<svg class="ig-chart__pictogram-base">${use}</svg>`
      + `<span class="ig-chart__pictogram-fill" style="${placeStyle({ width: fill })}">`
      + `<svg>${use}</svg></span></span>`;
  }).join("");
  const decimals = spec.unit?.decimals ?? (spec.of === 10 && spec.value % 1 ? 1 : 0);
  const value = formatValue(spec.value, locale, {
    kind: "number", decimals: spec.value % 1 ? 1 : 0,
  });
  const of = formatValue(spec.of, locale);
  const percent = formatValue(spec.value / spec.of * 100, locale, {
    kind: "percent", decimals,
  });
  const text = `${value} ${locale === "es" ? "de" : "of"} ${of}`;
  const body = symbol
    + `<div class="ig-chart__pictogram-summary"><strong>${escapeHtml(text)}</strong>`
    + `<span>${escapeHtml(percent)}</span><span>${escapeHtml(spec.label)}</span></div>`
    + `<div class="ig-chart__pictogram-grid" aria-hidden="true">${icons}</div>`;
  return renderFrame(spec, {
    instance: options.instance,
    body,
    table: {
      head: locale === "es" ? ["Etiqueta", "Valor", "De", "Porcentaje"]
        : ["Label", "Value", "Of", "Percent"],
      rows: [[spec.label, value, of, percent]],
    },
  });
}
