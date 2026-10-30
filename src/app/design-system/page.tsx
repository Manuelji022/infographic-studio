import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { FoundationsCatalog } from "@ds/catalog/Catalogs";
import { expandCharts } from "@ds/charts/index.ts";
import { DS_VERSION } from "@ds/infographic/manifest.ts";
import { getInfographicCss } from "@ds/infographic/render.ts";

export const metadata: Metadata = { title: "Design system" };

const EXAMPLES = ["pensiones", "gasto-publico"] as const;
const LOCALES = ["es", "en"] as const;

function readExample(id: (typeof EXAMPLES)[number]) {
  const examples = Object.fromEntries(
    LOCALES.map((locale) => {
      const dir = path.join(process.cwd(), "design-system", "examples");
      const fragment = readFileSync(path.join(dir, `${id}.${locale}.html`), "utf8");
      const match = /<h1 class="ig-header__title">([\s\S]*?)<\/h1>/.exec(fragment);
      if (!match) throw new Error(`Missing example title: ${id}.${locale}`);
      const title = match[1].replace(/<[^>]*>/g, "");
      const chartsPath = path.join(dir, `${id}.charts.${locale}.json`);
      const charts: unknown[] = existsSync(chartsPath)
        ? (JSON.parse(readFileSync(chartsPath, "utf8")) as unknown[])
        : [];
      return [locale, { title, html: expandCharts(fragment, charts, { locale }) }];
    }),
  );
  return { id, title: { es: examples.es.title, en: examples.en.title }, html: {
    es: examples.es.html,
    en: examples.en.html,
  } };
}

export default function Page() {
  const infographic = {
    css: getInfographicCss({ dsVersion: DS_VERSION, embed: true }),
    examples: EXAMPLES.map(readExample),
  };
  return <FoundationsCatalog infographic={infographic} />;
}
