import { formatValue } from "../format.ts";
import { fits } from "../layout/measure.ts";
import { layoutTreemap } from "../layout/treemap.ts";
import type { TreemapSpec } from "../schema/index.ts";
import {
  escapeHtml, LABEL_FONT, LABEL_LINE_HEIGHT, MIN_WIDTH, placeStyle, renderAlso,
  renderFrame, renderLegend, seriesClass, toneClass, words, type RenderOptions,
} from "./shared.ts";

const HEIGHT = { wide: 300, narrow: 320 } as const;

export function renderTreemap(spec: TreemapSpec, options: RenderOptions): string {
  const value = (n: number) => formatValue(n, options.locale, spec.unit);
  const variants = (["wide", "narrow"] as const).map((band) => {
    const width = MIN_WIDTH[band];
    const height = HEIGHT[band];
    const also: string[] = [];
    const cells = layoutTreemap(spec.items, width / height).items.map((rect) => {
      const item = spec.items[rect.index];
      const group = spec.groups?.find((entry) => entry.id === item.group);
      let color = group ? toneClass(group.tone)
        : rect.index < 6 ? seriesClass(rect.index) : "ig-chart__neutral";
      if (group?.tone === "highlight") {
        color = "ig-chart__highlight-soft";
      }
      if (item.emphasis) color = `ig-chart__${item.emphasis}`;
      // Tiny yellow marks cannot meet the minimum eight-pixel mark size.
      if (color.startsWith("ig-chart__highlight") &&
        Math.min(rect.w * width / 100, rect.h * height / 100) < 8) {
        color = "ig-chart__neutral";
      }
      const label = `${item.label}\n${value(item.value)}`;
      const show = color !== "ig-chart__s6" && fits(label, {
        width: rect.w * width / 100 - 20,
        height: rect.h * height / 100 - 20,
      }, LABEL_FONT, LABEL_LINE_HEIGHT);
      if (!show) also.push(`${item.label} ${value(item.value)}`);
      const text = show ? `<span class="ig-chart__label">${escapeHtml(label)}</span>` : "";
      const style = placeStyle({ left: rect.x, top: rect.y, width: rect.w, height: rect.h });
      return `<div class="ig-chart__cell ${color}" style="${style}">${text}</div>`;
    }).join("");
    const plot = `<div class="ig-chart__plot ig-chart__treemap-${band}">${cells}</div>`;
    return `<div class="ig-chart__${band}">${plot}` +
      `${renderAlso(words(options.locale).also, also)}</div>`;
  }).join("");
  const legend = spec.groups ? renderLegend(spec.groups.map((group) => ({
    label: group.label,
    className: toneClass(group.tone),
  }))) : "";
  const period = spec.period
    ? `<p class="ig-chart__treemap-period">${escapeHtml(spec.period)}</p>` : "";
  return renderFrame(spec, {
    body: `${period}${variants}${legend}`,
    table: {
      head: options.locale === "es" ? ["Categoría", "Valor", "Grupo"]
        : ["Category", "Value", "Group"],
      rows: spec.items.map((item) => [item.label, value(item.value),
        spec.groups?.find((group) => group.id === item.group)?.label ?? ""]),
    },
  });
}
