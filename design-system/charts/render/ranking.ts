import type { RankingSpec } from "../schema/index.ts";
import { formatValue } from "../format.ts";
import { textWidth } from "../layout/measure.ts";
import { linearScale, niceDomain } from "../layout/scale.ts";
import {
  escapeHtml, fillClass, LABEL_FONT, num, placeStyle, renderFrame, type RenderOptions,
} from "./shared.ts";

export function renderRanking(spec: RankingSpec, options: RenderOptions): string {
  const items = spec.items.toSorted((a, b) =>
    spec.order === "asc" ? a.value - b.value : b.value - a.value);
  const domain = niceDomain(items.map((i) => i.value), { includeZero: true, maxTicks: 5 });
  const scale = linearScale([domain.min, domain.max], [0, 100]);
  const zero = scale(0);
  const valueSpace = (negative: boolean) => Math.max(0, ...items
    .filter((item) => negative ? item.value < 0 : item.value >= 0)
    .map((item) => textWidth(formatValue(item.value, options.locale, spec.unit), LABEL_FONT) + 10));
  const spacing = `--ranking-before:${num(valueSpace(true))}`
    + `;--ranking-after:${num(valueSpace(false))}`;
  const rows = items.map((item, index) => {
    const end = scale(item.value);
    const geometry = placeStyle({ left: Math.min(zero, end), width: Math.abs(end - zero) });
    return '<li class="ig-chart__ranking-row">'
      + `<span class="ig-chart__ranking-position">${escapeHtml(
        formatValue(index + 1, options.locale))}</span>`
      + `<span class="ig-chart__label ig-chart__ranking-label">${escapeHtml(item.label)}</span>`
      + '<div class="ig-chart__ranking-track"><div class="ig-chart__ranking-scale">'
      + `<span class="ig-chart__ranking-zero" style="${placeStyle({ left: zero })}"></span>`
      + `<span class="ig-chart__ranking-bar ${fillClass("ig-chart__s1", item.emphasis)}"`
      + ` style="${geometry}"></span>`
      + `<span class="ig-chart__value ig-chart__ranking-value${
        item.value < 0 ? " ig-chart__ranking-value--negative" : ""}"`
      + ` style="${placeStyle({ left: end, top: 50 })}">`
      + `${escapeHtml(formatValue(item.value, options.locale, spec.unit))}</span></div></div></li>`;
  }).join("");
  return renderFrame(spec, {
    instance: options.instance,
    body: `<ol class="ig-chart__ranking-list" style="${spacing}">${rows}</ol>`,
    table: {
      head: [options.locale === "es" ? "Categoría" : "Category",
        options.locale === "es" ? "Valor" : "Value"],
      rows: items.map((i) => [i.label, formatValue(i.value, options.locale, spec.unit)]),
    },
  });
}
