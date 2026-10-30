import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { composeDocument, CSP_STANDALONE } from "../../design-system/infographic/document.ts";
import { getInfographicCss } from "../../design-system/infographic/render.ts";
import { renderLineSpike } from "../../design-system/charts/spike/line.ts";

const css = readFileSync("design-system/charts/spike/line.css", "utf8");
const values = [
  [8.1, 7.9, 9.9, 11.1, 12.9, 12.6, 13.4, 14.6, 15.8, 16.3, 16.1],
  [10.2, 10.1, 11.4, 11.5, 12.2, 11.9, 12.3, 12.6, 12.8, 12.7, 12.4],
];
const out = path.resolve("design-system/reports/charts-spike/line");
mkdirSync(out, { recursive: true });
const variants = [["es", "light"], ["es", "dark"], ["en", "light"]] as const;
for (const [locale, theme] of variants) {
  const names = locale === "es" ? ["España", "Media UE"] : ["Spain", "EU average"];
  const data = values.map((seriesValues, index) => ({
    name: names[index],
    values: seriesValues,
  }));
  const fragment = renderLineSpike(data, locale);
  const document = composeDocument(fragment, {
    locale,
    theme,
    css: getInfographicCss({ dsVersion: "1.0.0", embed: false }) + css,
    csp: CSP_STANDALONE,
  });
  const file = path.join(out, `${locale}-${theme}.html`);
  writeFileSync(file, document);
  console.log(`Wrote ${file}`);
}
