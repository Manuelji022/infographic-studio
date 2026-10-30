// renderChart dispatches on `type`. Owned by the coordinator (CHART_LIBRARY_PLAN.md §5.5).
import type { ChartSpec } from "../schema/index.ts";
import { renderColumn } from "./column.ts";
import { renderDonut } from "./donut.ts";
import { renderLine } from "./line.ts";
import { renderPictogram } from "./pictogram.ts";
import { renderRanking } from "./ranking.ts";
import { renderScatter } from "./scatter.ts";
import type { RenderOptions } from "./shared.ts";
import { renderStacked } from "./stacked.ts";
import { renderTreemap } from "./treemap.ts";

export { NotImplementedError, type ChartLocale, type RenderOptions } from "./shared.ts";

/** Static markup for a validated spec. Pure: same spec and options, same string. */
export function renderChart(spec: ChartSpec, options: RenderOptions): string {
  if (options.locale !== "es" && options.locale !== "en") {
    throw new Error("Unsupported chart locale");
  }
  switch (spec.type) {
    case "line":
      return renderLine(spec, options);
    case "column":
      return renderColumn(spec, options);
    case "stacked":
      return renderStacked(spec, options);
    case "donut":
      return renderDonut(spec, options);
    case "pictogram":
      return renderPictogram(spec, options);
    case "scatter":
      return renderScatter(spec, options);
    case "ranking":
      return renderRanking(spec, options);
    case "treemap":
      return renderTreemap(spec, options);
  }
}
