import type { LineSpec } from "../schema/index.ts";
import { formatTick, formatValue } from "../format.ts";
import { linearScale, niceDomain } from "../layout/scale.ts";
import { textWidth } from "../layout/measure.ts";
import {
  escapeHtml, LABEL_FONT, MIN_WIDTH, num, placeStyle, renderFrame, renderLegend,
  seriesClass, TICK_FONT, words, type RenderOptions,
} from "./shared.ts";

function separate(positions: number[], gap: number): number[] {
  const sorted = positions.map((top, index) => ({ top, index })).sort((a, b) => a.top - b.top);
  sorted.forEach((item, i) => {
    item.top = Math.max(8, item.top, i ? sorted[i - 1].top + gap : 8);
  });
  const excess = Math.max(0, (sorted.at(-1)?.top ?? 0) - 92);
  return positions.map((_, i) => sorted.find((item) => item.index === i)!.top - excess);
}

export function renderLine(spec: LineSpec, options: RenderOptions): string {
  const { locale } = options;
  const valueText = (value: number) => formatValue(value, locale, spec.unit);
  const xText = spec.x.values.map((v) => String(v));
  const values = spec.series.flatMap((s) => s.values.filter((v) => v !== null));
  const domain = niceDomain(values.length ? values : [0], { includeZero: true, maxTicks: 5 });
  const y = linearScale([domain.min, domain.max], [92, 8]);
  const years = spec.x.values as number[];
  const yearScale = spec.x.kind === "year"
    ? linearScale([Math.min(...years), Math.max(...years)], [0, 100]) : undefined;
  const x = (i: number) => spec.x.values.length === 1 ? 50 : yearScale
    ? yearScale(years[i]) : i / (spec.x.values.length - 1) * 100;
  const tickText = domain.ticks.map((v) => formatTick(v, locale, spec.unit));
  const tickSpace = Math.max(...tickText.map((t) => textWidth(t, TICK_FONT))) + 10;
  const ends = spec.series.map((s) => s.values.findLastIndex((v) => v !== null));
  const endNames = spec.series.map((s, i) => ends[i] < 0 ? s.name
    : `${s.name} ${valueText(s.values[ends[i]]!)}`);
  const endY = separate(spec.series.map((s, i) => ends[i] < 0 ? 50 : y(s.values[ends[i]]!)), 13);
  const geometry = spec.series.map((s, si) => {
    const segments = s.values.map((v, i) => {
      const previous = s.values[i - 1];
      if (v === null || previous === null || previous === undefined) return "";
      const projected = s.projectedFrom !== undefined && i >= s.projectedFrom;
      const cls = `ig-chart__line-stroke${projected ? " ig-chart__line-projected" : ""}`;
      return `<line class="${cls}" x1="${num(x(i - 1))}" x2="${num(x(i))}"` +
        ` y1="${num(y(previous))}" y2="${num(y(v))}"/>`;
    }).join("");
    const dots = s.values.map((v, i) => v === null ? "" :
      `<span class="ig-chart__line-dot ${seriesClass(si)}"` +
      ` style="${placeStyle({ left: x(i), top: y(v) })}"></span>`).join("");
    return { segments: `<g class="${seriesClass(si)}">${segments}</g>`, dots };
  });
  const grid = domain.ticks.map((v) => {
    const cls = v === 0 && domain.min < 0 ? "ig-chart__axis" : "ig-chart__grid";
    return `<line class="${cls}" x1="0" x2="100" y1="${num(y(v))}"` +
      ` y2="${num(y(v))}"/>`;
  }).join("");
  function band(narrow: boolean): string {
    const width = narrow ? MIN_WIDTH.narrow : MIN_WIDTH.wide;
    const left = Math.min(42, tickSpace / width * 100);
    const reserve = narrow ? 4 / width * 100 : Math.min(46,
      (Math.max(...endNames.map((t) => textWidth(t, LABEL_FONT))) + 16) / width * 100);
    const plotWidth = 100 - left - reserve;
    const available = width * plotWidth / 100;
    const selected = [0];
    const sorted = spec.x.values.map((_, i) => i).sort((a, b) => x(a) - x(b));
    selected[0] = sorted[0];
    for (const i of sorted.slice(1, -1)) {
      const prev = selected.at(-1)!;
      const space = (textWidth(xText[prev], TICK_FONT) + textWidth(xText[i], TICK_FONT)) / 2;
      if ((x(i) - x(prev)) * available / 100 >= space + 12) selected.push(i);
    }
    const last = sorted.at(-1)!;
    while (selected.length > 1) {
      const prev = selected.at(-1)!;
      const space = (textWidth(xText[prev], TICK_FONT) + textWidth(xText[last], TICK_FONT)) / 2;
      if ((x(last) - x(prev)) * available / 100 >= space + 12) break;
      selected.pop();
    }
    if (last !== selected[0]) selected.push(last);
    const ticks = domain.ticks.map((v, i) =>
      `<span class="ig-chart__tick ig-chart__line-y"` +
      ` style="${placeStyle({ left, top: y(v) })}">${escapeHtml(tickText[i])}</span>`).join("");
    // Wide: "Name value" right of the plot, in the reserved margin, so it never covers a line.
    const labels = narrow ? "" : spec.series.map((s, i) => ends[i] < 0 ? "" :
      `<span class="ig-chart__label ig-chart__line-end"` +
      ` style="${placeStyle({ left: 100, top: endY[i] })}">${escapeHtml(endNames[i])}</span>`,
    ).join("");
    const xLabels = selected.map((i) => {
      const edge = x(i) === 0 ? "start" : x(i) === 100 ? "end" : "middle";
      return `<span class="ig-chart__tick ig-chart__line-x ig-chart__line-x-${edge}"` +
        ` style="${placeStyle({ left: x(i), top: 96 })}">${escapeHtml(xText[i])}</span>`;
    }).join("");
    // Narrow: no labels inside the plot; the legend carries each name and its last value.
    const legendHtml = narrow ? renderLegend(spec.series.map((s, i) => ({
      label: s.name,
      className: seriesClass(i),
      value: ends[i] < 0 ? undefined : valueText(s.values[ends[i]]!),
    }))) : "";
    return `<div class="ig-chart__${narrow ? "narrow" : "wide"}">` +
      `<div class="ig-chart__plot ig-chart__plot--h-lg">${ticks}` +
      `<div class="ig-chart__line-area"` +
      ` style="${placeStyle({ left, width: plotWidth, top: 0, height: 100 })}">` +
      '<svg class="ig-chart__svg" viewBox="0 0 100 100"' +
      ' preserveAspectRatio="none" aria-hidden="true">' + grid +
      geometry.map((g) => g.segments).join("") + "</svg>" +
      geometry.map((g) => g.dots).join("") + labels + xLabels + "</div></div>" +
      legendHtml + "</div>";
  }
  return renderFrame(spec, {
    body: band(false) + band(true),
    table: {
      head: [locale === "es" ? "Periodo" : "Period", ...spec.series.map((s) => s.name)],
      rows: xText.map((t, i) => [t, ...spec.series.map((s) => {
        const value = s.values[i];
        if (value === null) return "—";
        const projected = s.projectedFrom !== undefined && i >= s.projectedFrom;
        return valueText(value) + (projected ? ` · ${words(locale).projected}` : "");
      })]),
    },
  });
}
