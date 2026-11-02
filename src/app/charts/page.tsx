import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ChartsCatalog } from "@ds/catalog/Catalogs";
import type { ChartSample } from "@ds/catalog/types";
import { renderChart, validateChartSpec, type ChartType } from "@ds/charts/index.ts";
import { DS_VERSION } from "@ds/infographic/manifest.ts";
import { getInfographicCss } from "@ds/infographic/render.ts";

export const metadata: Metadata = { title: "Charts" };

// One representative fixture per chart type. The other fixtures stay for the tests and the
// reports in design-system/reports/charts/.
const SHOWCASE: Record<ChartType, string> = {
  line: "line.projected",
  column: "column",
  stacked: "stacked.columns.absolute",
  donut: "donut",
  pictogram: "pictogram.hundred",
  scatter: "scatter.dense",
  ranking: "ranking.fifteen",
  treemap: "treemap",
};

const FIXTURES = path.join(process.cwd(), "design-system", "charts", "fixtures", "valid");

function renderFixture(file: string, locale: "es" | "en"): { title: string; html: string } {
  const result = validateChartSpec(JSON.parse(readFileSync(path.join(FIXTURES, file), "utf8")));
  if (!result.ok) throw new Error(`Invalid chart fixture: ${file}`);
  return { title: result.spec.title, html: renderChart(result.spec, { locale }) };
}

function showcaseSamples(): ChartSample[] {
  return Object.entries(SHOWCASE).map(([type, stem]) => {
    const es = renderFixture(`${stem}.es.json`, "es");
    const en = renderFixture(`${stem}.en.json`, "en");
    return { id: type, title: { es: es.title, en: en.title }, html: { es: es.html, en: en.html } };
  });
}

export default function Page() {
  // The catalog shows charts flush with its own headings, not in the centered prose column.
  const css = [
    getInfographicCss({ dsVersion: DS_VERSION, embed: true }),
    ".ig-root{max-width:none;margin:0;padding:var(--ds-spacing-24)}",
  ].join("\n");
  return <ChartsCatalog charts={{ css, samples: showcaseSamples() }} />;
}
