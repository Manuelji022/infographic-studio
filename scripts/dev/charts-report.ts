// Usage: node scripts/dev/charts-report.ts [type ...]
// Renders every valid fixture of each chart type into design-system/reports/charts/<type>.html
// (theme "auto", so the browser's color scheme picks light or dark). Deterministic: re-running
// without changes produces identical files, so the reports can be compared by diff.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  NotImplementedError,
  renderChart,
  validateChartSpec,
} from "../../design-system/charts/index.ts";
import type { ChartType } from "../../design-system/charts/index.ts";
import { composeDocument, CSP_STANDALONE } from "../../design-system/infographic/document.ts";
import { getInfographicCss } from "../../design-system/infographic/render.ts";

const TYPES: ChartType[] = [
  "line", "column", "stacked", "donut", "pictogram", "scatter", "ranking", "treemap",
];
const requested = process.argv.slice(2);
for (const type of requested) {
  if (!TYPES.includes(type as ChartType)) throw new Error(`Unknown chart type: ${type}`);
}
const types = requested.length > 0 ? (requested as ChartType[]) : TYPES;
const fixtures = path.resolve("design-system/charts/fixtures/valid");
const out = path.resolve("design-system/reports/charts");
mkdirSync(out, { recursive: true });
const reportCss = [
  ".report-case{padding:24px 0;border-top:1px solid var(--ds-border)}",
  ".report-case>h2{margin:0 0 16px;font-size:12px;color:var(--ds-text-muted)}",
].join("");
const css = getInfographicCss({ dsVersion: "1.0.0", embed: false }) + reportCss;
let failed = 0;

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

for (const type of types) {
  const files = readdirSync(fixtures)
    .filter((file) => file.endsWith(".json") && file.split(".")[0] === type)
    .sort();
  const cases: string[] = [];
  let skipped = false;
  for (const file of files) {
    const result = validateChartSpec(JSON.parse(readFileSync(path.join(fixtures, file), "utf8")));
    if (!result.ok) {
      console.error(`FAIL ${file}: invalid fixture ${JSON.stringify(result.issues)}`);
      failed++;
      continue;
    }
    const locale = /\.en\.json$/.test(file) ? "en" : "es";
    try {
      const markup = renderChart(result.spec, { locale });
      if (renderChart(result.spec, { locale }) !== markup) {
        console.error(`FAIL ${file}: render is not deterministic`);
        failed++;
      }
      cases.push(
        `<section class="report-case" lang="${locale}"><h2>${escapeText(file)}</h2>` +
          `${markup}</section>`,
      );
    } catch (error) {
      if (error instanceof NotImplementedError) {
        skipped = true;
        break;
      }
      console.error(`FAIL ${file}: ${(error as Error).message}`);
      failed++;
    }
  }
  if (skipped) {
    console.log(`SKIP ${type}: not implemented`);
    continue;
  }
  // One wrapper: .ig-root spaces its direct children like infographic sections.
  const document = composeDocument(`<div>${cases.join("")}</div>`, {
    locale: "es",
    theme: "auto",
    css,
    csp: CSP_STANDALONE,
    title: `Charts report: ${type}`,
  });
  const file = path.join(out, `${type}.html`);
  writeFileSync(file, document);
  console.log(`Wrote ${path.relative(process.cwd(), file)} (${cases.length} fixtures)`);
}

if (failed > 0) {
  console.error(`${failed} failure(s)`);
  process.exit(1);
}
