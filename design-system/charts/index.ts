// API pública de la librería de gráficos; ver CHART_LIBRARY_PLAN.md §5.5
export { validateChartSpec } from "./schema/index.ts";
export type { ChartIssue, ChartSpec, ChartType } from "./schema/index.ts";
export { NotImplementedError, renderChart } from "./render/index.ts";
export type { ChartLocale, RenderOptions } from "./render/index.ts";
export { expandCharts } from "./expand.ts";
export type { ExpandChartsOptions } from "./expand.ts";
