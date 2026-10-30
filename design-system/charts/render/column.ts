import type { ColumnSpec } from "../schema/index.ts";
import { formatTick, formatValue } from "../format.ts";
import { fits, textWidth } from "../layout/measure.ts";
import { linearScale, niceDomain } from "../layout/scale.ts";
import {
  escapeHtml, LABEL_FONT, LABEL_LINE_HEIGHT, MIN_WIDTH, TICK_FONT, num, placeStyle,
  renderFrame, renderLegend, seriesClass, type RenderOptions,
} from "./shared.ts";

export function renderColumn(spec: ColumnSpec, options: RenderOptions): string {
  const value = (n: number) => formatValue(n, options.locale, spec.unit);
  const domain = niceDomain(spec.series.flatMap((s) => s.values), {
    includeZero: true, maxTicks: 5,
  });
  const y = linearScale([domain.min, domain.max], [85, 12]);
  const required = Math.max(...spec.categories.map((category) => textWidth(category, LABEL_FONT)),
    ...spec.series.flatMap((s) => s.values.map((n) =>
      (textWidth(value(n), LABEL_FONT) + 12) * spec.series.length))) + 16;
  const vertical = (band: keyof typeof MIN_WIDTH) => {
    const axis = Math.max(...domain.ticks.map((tick) =>
      textWidth(formatTick(tick, options.locale, spec.unit), TICK_FONT))) + 8;
    const available = MIN_WIDTH[band] - axis;
    const categories = spec.categories;
    const step = 100 / categories.length;
    if (required > available / categories.length || !categories.every((category) =>
      fits(category, { width: available / categories.length - 8, height: LABEL_LINE_HEIGHT },
        LABEL_FONT, LABEL_LINE_HEIGHT))) return horizontal(band);
    let result = "";
    {
      const barWidth = step * 0.72 / spec.series.length;
      let shapes = "";
      let labels = "";
      for (const tick of domain.ticks) {
        shapes += `<line class="ig-chart__grid" x1="0" x2="100" ` +
          `y1="${num(y(tick))}" y2="${num(y(tick))}"/>`;
        labels += `<span class="ig-chart__tick ig-chart__column-tick" ` +
          `style="${placeStyle({ top: y(tick) })}">` +
          `${escapeHtml(formatTick(tick, options.locale, spec.unit))}</span>`;
      }
      shapes += `<line class="ig-chart__axis" x1="0" x2="100" ` +
        `y1="${num(y(0))}" y2="${num(y(0))}"/>`;
      categories.forEach((category, index) => {
        const left = index * step;
        spec.series.forEach((series, s) => {
          const n = series.values[index];
          const x = left + step * 0.14 + s * barWidth;
          shapes += `<rect class="ig-chart__column-bar ${seriesClass(s)}" ` +
            `x="${num(x)}" y="${num(Math.min(y(n), y(0)))}" ` +
            `width="${num(barWidth * 0.82)}" height="${num(Math.abs(y(n) - y(0)))}"/>`;
          const negative = n < 0 ? " ig-chart__column-below" : "";
          labels += `<span class="ig-chart__value ig-chart__column-value${negative}" ` +
            `style="${placeStyle({ left: x + barWidth * 0.41, top: y(n) })}">` +
            `${escapeHtml(value(n))}</span>`;
        });
        labels += `<span class="ig-chart__label ig-chart__column-category" ` +
          `style="${placeStyle({ left, top: 94, width: step })}">` +
          `${escapeHtml(category)}</span>`;
      });
      result += `<div class="ig-chart__plot ig-chart__column-plot" ` +
        `style="--column-axis:${num(axis)}">` +
        '<svg class="ig-chart__svg" viewBox="0 0 100 100" ' +
        `preserveAspectRatio="none" aria-hidden="true">${shapes}</svg>${labels}</div>`;
    }
    return result;
  };
  const horizontal = (band: keyof typeof MIN_WIDTH) => spec.categories.map((category, i) => {
    const reserve = Math.max(...spec.series.flatMap((s) => s.values.map((n) =>
      textWidth(value(n), LABEL_FONT)))) + 10;
    const edge = Math.min(40, reserve / MIN_WIDTH[band] * 100);
    const x = linearScale([domain.min, domain.max], [
      domain.min < 0 ? edge : 0, domain.max > 0 ? 100 - edge : 100,
    ]);
    const rows = spec.series.map((series, s) => {
      const n = series.values[i];
      const negative = n < 0 ? " ig-chart__column-end-negative" : "";
      return `<div class="ig-chart__column-row"><div class="ig-chart__column-track">` +
        `<span class="ig-chart__column-mark ${seriesClass(s)}" ` +
        `style="${placeStyle({ left: Math.min(x(0), x(n)), width: Math.abs(x(n) - x(0)) })}">` +
        `</span><span class="ig-chart__value ig-chart__column-end${negative}" ` +
        `style="${placeStyle({ left: x(n) })}">${escapeHtml(value(n))}</span></div></div>`;
    }).join("");
    return `<div class="ig-chart__column-group"><p class="ig-chart__label">` +
      `${escapeHtml(category)}</p>${rows}</div>`;
  }).join("");
  const legend = spec.series.length > 1 ? renderLegend(spec.series.map((s, i) => ({
    label: s.name, className: seriesClass(i),
  }))) : "";
  return renderFrame(spec, {
    body: `<div class="ig-chart__wide">${vertical("wide")}</div>` +
      `<div class="ig-chart__narrow">${vertical("narrow")}</div>` +
      legend,
    table: {
      head: [
        options.locale === "es" ? "Categoría" : "Category", ...spec.series.map((s) => s.name),
      ],
      rows: spec.categories.map((c, i) => [c, ...spec.series.map((s) => value(s.values[i]))]),
    },
  });
}
