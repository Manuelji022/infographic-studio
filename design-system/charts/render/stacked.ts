import type { StackedSpec } from "../schema/index.ts";
import { formatTick, formatValue } from "../format.ts";
import { fits, textWidth } from "../layout/measure.ts";
import { linearScale, niceDomain } from "../layout/scale.ts";
import {
  escapeHtml, LABEL_FONT, LABEL_LINE_HEIGHT, MIN_WIDTH, TICK_FONT, num, placeStyle,
  renderFrame, renderLegend, seriesClass, type RenderOptions,
} from "./shared.ts";

export function renderStacked(spec: StackedSpec, options: RenderOptions): string {
  const totals = spec.categories.map((_, i) =>
    spec.series.reduce((sum, s) => sum + s.values[i], 0));
  const percent = spec.mode === "percent";
  const unit = percent ? spec.unit?.kind === "percent" ? spec.unit : {
    kind: "percent" as const, decimals: 1 as const,
  } : spec.unit;
  const amount = (s: number, c: number) => percent
    ? totals[c] === 0 ? 0 : spec.series[s].values[c] / totals[c] * 100
    : spec.series[s].values[c];
  const value = (s: number, c: number) => formatValue(amount(s, c), options.locale, unit);
  const domain = niceDomain(percent ? [100] : totals, { includeZero: true, maxTicks: 5 });
  const y = linearScale([domain.min, domain.max], [86, 12]);
  const variant = (band: keyof typeof MIN_WIDTH) => {
    const width = MIN_WIDTH[band];
    const axis = Math.max(...domain.ticks.map((tick) =>
      textWidth(formatTick(tick, options.locale, unit), TICK_FONT))) + 8;
    const available = width - axis;
    const categoryWidth = available / spec.categories.length;
    const columnsFit = spec.categories.every((category, c) => {
      const labels = [category, ...spec.series.map((_, s) => value(s, c))];
      if (!percent) labels.push(formatValue(totals[c], options.locale, spec.unit));
      return labels.every((label) => fits(label, {
        width: categoryWidth * 0.76 - 12, height: LABEL_LINE_HEIGHT,
      }, LABEL_FONT, LABEL_LINE_HEIGHT));
    });
    const isBar = spec.layout === "bar" || !columnsFit;
    const groups = isBar ? spec.categories.map((_, i) => [i])
      : [spec.categories.map((_, i) => i)];
    return groups.map((indices) => {
      const step = 100 / indices.length;
      let cells = "";
      let labels = "";
      let lines = "";
      const legends: string[] = [];
      if (!isBar) {
        for (const tick of domain.ticks) {
          lines += `<line class="ig-chart__grid" x1="0" x2="100" ` +
            `y1="${num(y(tick))}" y2="${num(y(tick))}"/>`;
          labels += `<span class="ig-chart__tick ig-chart__stacked-tick" ` +
            `style="${placeStyle({ top: y(tick) })}">` +
            `${escapeHtml(formatTick(tick, options.locale, unit))}</span>`;
        }
      }
      indices.forEach((c, local) => {
        const category = spec.categories[c];
        let cumulative = 0;
        const missing: { label: string; className: string; value: string }[] = [];
        spec.series.forEach((series, s) => {
          const n = amount(s, c);
          const fraction = totals[c] === 0 ? 0 : series.values[c] / totals[c];
          const barAmount = spec.layout === "bar" || percent
            ? fraction * 100 : n / domain.max * 100;
          const left = isBar ? cumulative : local * step + step * 0.12;
          const top = isBar ? 10 : y(cumulative + n);
          const cellWidth = isBar ? barAmount : step * 0.76;
          const height = isBar ? 65 : y(cumulative) - y(cumulative + n);
          const label = value(s, c);
          const inside = s !== 5 && fits(label, {
            width: (isBar ? width : available) * cellWidth / 100 - 12,
            height: (isBar ? 80 : 320) * height / 100 - 8,
          }, LABEL_FONT, LABEL_LINE_HEIGHT);
          cells += `<div class="ig-chart__cell ig-chart__stacked-cell ${seriesClass(s)}" ` +
            `style="${placeStyle({ left, top, width: cellWidth, height })}">` +
            `${inside ? `<span class="ig-chart__value">${escapeHtml(label)}</span>` : ""}</div>`;
          if (!inside) missing.push({
            label: series.name, className: seriesClass(s), value: label,
          });
          cumulative += isBar ? barAmount : n;
        });
        if (!isBar) {
          labels += `<span class="ig-chart__label ig-chart__stacked-category" ` +
            `style="${placeStyle({ left: local * step, top: 94, width: step })}">` +
            `${escapeHtml(category)}</span>`;
          if (!percent) {
            labels += `<span class="ig-chart__value ig-chart__stacked-total" ` +
              `style="${placeStyle({ left: (local + 0.5) * step, top: y(totals[c]) })}">` +
              `${escapeHtml(formatValue(totals[c], options.locale, spec.unit))}</span>`;
          }
        }
        if (missing.length > 0) {
          const heading = isBar ? "" : `<p class="ig-chart__label">${escapeHtml(category)}</p>`;
          legends.push(`<div class="ig-chart__stacked-detail">` +
            `${heading}${renderLegend(missing)}</div>`);
        }
      });
      const className = isBar ? "ig-chart__stacked-bar" : "ig-chart__stacked-columns";
      const c = indices[0];
      const total = !percent ? ` · ${formatValue(totals[c], options.locale, spec.unit)}` : "";
      const heading = isBar ? `<p class="ig-chart__label ig-chart__stacked-heading">` +
        `${escapeHtml(spec.categories[c] + total)}</p>` : "";
      const style = isBar ? "" : ` style="--stacked-axis:${num(axis)}"`;
      return heading + `<div class="ig-chart__plot ${className}"${style}>` +
        '<svg class="ig-chart__svg" viewBox="0 0 100 100" ' +
        `preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${cells}${labels}</div>` +
        legends.join("");
    }).join("");
  };
  return renderFrame(spec, {
    body: `<div class="ig-chart__wide">${variant("wide")}</div>` +
      `<div class="ig-chart__narrow">${variant("narrow")}</div>` +
      renderLegend(spec.series.map((series, i) => ({
        label: series.name, className: seriesClass(i),
      }))),
    table: {
      head: [
        options.locale === "es" ? "Categoría" : "Category", ...spec.series.map((s) => s.name),
      ],
      rows: spec.categories.map((category, c) => [category, ...spec.series.map((_, s) => {
        const original = formatValue(spec.series[s].values[c], options.locale, spec.unit);
        return percent ? `${original} (${value(s, c)})` : original;
      })]),
    },
  });
}
