import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ChartsCatalog } from "@ds/catalog/Catalogs";
import type { ChartSample } from "@ds/catalog/types";
import { renderLineSpike } from "@ds/charts/spike/line.ts";
import { renderTreemapSpike } from "@ds/charts/spike/treemap.ts";
import { DS_VERSION } from "@ds/infographic/manifest.ts";
import { getInfographicCss } from "@ds/infographic/render.ts";

export const metadata: Metadata = { title: "Charts" };

// Wave 0 spike data (illustrative). Replaced by the library fixtures in Wave 3.
const LINE_VALUES = [
  [8.1, 7.9, 9.9, 11.1, 12.9, 12.6, 13.4, 14.6, 15.8, 16.3, 16.1],
  [10.2, 10.1, 11.4, 11.5, 12.2, 11.9, 12.3, 12.6, 12.8, 12.7, 12.4],
];
const LINE_NAMES = { es: ["España", "Media UE"], en: ["Spain", "EU average"] };

function lineFragment(locale: "es" | "en"): string {
  const data = LINE_VALUES.map((values, index) => ({ name: LINE_NAMES[locale][index], values }));
  return renderLineSpike(data, locale);
}

function readSpikeCss(file: string): string {
  return readFileSync(path.join(process.cwd(), "design-system", "charts", "spike", file), "utf8");
}

export default function Page() {
  const samples: ChartSample[] = [
    {
      id: "line",
      title: { es: "Líneas", en: "Line" },
      html: { es: lineFragment("es"), en: lineFragment("en") },
    },
    {
      id: "treemap",
      title: { es: "Treemap", en: "Treemap" },
      html: { es: renderTreemapSpike([], "es"), en: renderTreemapSpike([], "en") },
    },
  ];
  const css = [
    getInfographicCss({ dsVersion: DS_VERSION, embed: true }),
    readSpikeCss("line.css"),
    readSpikeCss("treemap.css"),
  ].join("\n");
  return <ChartsCatalog charts={{ css, samples }} />;
}
