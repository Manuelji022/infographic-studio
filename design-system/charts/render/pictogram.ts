import type { PictogramSpec } from "../schema/index.ts";
import { formatValue } from "../format.ts";
import { escapeHtml, num, placeStyle, renderFrame, type RenderOptions } from "./shared.ts";

const PERSON = '<svg viewBox="0 0 20 24" aria-hidden="true">'
  + '<path d="M10 0a3 3 0 1 1 0 6a3 3 0 0 1 0-6M5 8h10l3 8h-4v8h-3v-8H9v8H6v-8H2Z"/>'
  + '</svg>';

export function renderPictogram(spec: PictogramSpec, options: RenderOptions): string {
  const { locale } = options;
  const shape = spec.icon === "person" ? PERSON : '<span></span>';
  const icons = Array.from({ length: spec.of }, (_, i) => {
    const fill = Math.min(1, Math.max(0, spec.value - i)) * 100;
    return `<span class="ig-chart__pictogram-icon ig-chart__pictogram-${spec.icon}"`
      + ` data-icon="${i}" data-fill="${num(fill)}">`
      + `<span class="ig-chart__pictogram-base ig-chart__neutral">${shape}</span>`
      + '<span class="ig-chart__pictogram-fill ig-chart__s1"'
      + ` style="${placeStyle({ width: fill })}">${shape}</span></span>`;
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
  const body = `<div class="ig-chart__pictogram-summary"><strong>${escapeHtml(text)}</strong>`
    + `<span>${escapeHtml(percent)}</span><span>${escapeHtml(spec.label)}</span></div>`
    + `<div class="ig-chart__pictogram-grid" aria-hidden="true">${icons}</div>`;
  return renderFrame(spec, {
    body,
    table: {
      head: locale === "es" ? ["Etiqueta", "Valor", "De", "Porcentaje"]
        : ["Label", "Value", "Of", "Percent"],
      rows: [[spec.label, value, of, percent]],
    },
  });
}
