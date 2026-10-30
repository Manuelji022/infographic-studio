import { validateChartSpec, type ChartSpec } from "./schema/index.ts";
import { renderChart } from "./render/index.ts";

export type ExpandChartsOptions = { locale: "es" | "en" };

export function expandCharts(
  fragment: string,
  charts: readonly unknown[],
  options: ExpandChartsOptions,
): string {
  const specs = new Map<string, ChartSpec>();
  charts.forEach((input, index) => {
    const result = validateChartSpec(input);
    if (!result.ok) {
      const codes = result.issues.map((issue) => issue.code).join(", ");
      throw new Error(`Invalid chart at index ${index}: ${codes}`);
    }
    if (specs.has(result.spec.id)) {
      throw new Error(`Duplicate chart id: ${result.spec.id}`);
    }
    specs.set(result.spec.id, result.spec);
  });

  const instances = new Map<string, number>();
  const holes = /<div class="ig-chart" data-chart="([a-z][a-z0-9-]{0,31})"><\/div>/g;
  return fragment.replace(holes, (_match, id: string) => {
    const spec = specs.get(id);
    if (!spec) throw new Error(`Missing chart spec for id: ${id}`);
    const instance = instances.get(id) ?? 0;
    instances.set(id, instance + 1);
    return renderChart(spec, { locale: options.locale, instance });
  });
}
