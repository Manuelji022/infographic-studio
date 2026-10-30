import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderChart } from "../../design-system/charts/render/index.ts";
import { buildDocument } from "../../design-system/infographic/render.ts";

const fixtureDir = "design-system/charts/fixtures/valid";
function fixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(fixtureDir, name), "utf8")) as Record<string, unknown>;
}
const fragment =
  '<header class="ig-header"><h1 class="ig-header__title">Example</h1></header>' +
  '<div class="ig-stat"><p class="ig-stat__value">2</p></div>';
const hole = (id: string) => `<div class="ig-chart" data-chart="${id}"></div>`;
let failures = 0;
function check(name: string, condition: boolean): void {
  console.log(`${condition ? "OK" : "FAIL"} ${name}`);
  if (!condition) failures += 1;
}
function throws(build: () => unknown): boolean {
  try {
    build();
    return false;
  } catch (error) {
    return error instanceof Error;
  }
}
const common = {
  locale: "es" as const,
  theme: "light" as const,
  dsVersion: "1.0.0",
  title: '<b>&"',
};
const standalone = buildDocument(fragment, { ...common, embed: false });
const iframe = buildDocument(fragment, { ...common, embed: true });
check(
  "standalone fonts embedded",
  !standalone.includes("url(/fonts") &&
    (standalone.match(/data:font\/woff2;base64,/g) ?? []).length === 3,
);
check("iframe fonts retained", iframe.includes("/fonts/") && !iframe.includes("data:font"));
check(
  "invalid options rejected",
  throws(() => buildDocument(fragment, { ...common, embed: false, locale: "xx" as "es" })) &&
    throws(() => buildDocument(fragment, { ...common, embed: false, theme: "bad" as "light" })) &&
    throws(() => buildDocument(fragment, { ...common, embed: false, dsVersion: "9.9.9" })),
);
check(
  "unsafe fragments rejected",
  throws(() => buildDocument("<script>", { ...common, embed: false })) &&
    throws(() => buildDocument("</STYLE>", { ...common, embed: false })),
);
check("title escaped", standalone.includes("&lt;b&gt;&amp;&quot;"));
check("locale and theme emitted", standalone.includes('lang="es" data-ds-theme="light"'));

const line = fixture("line.projected.es.json");
const treemap = fixture("treemap.es.json");
const pairFragment = hole(String(line.id)) + hole(String(treemap.id));
const pairCharts = [line, treemap];
for (const [label, embed] of [["standalone", false], ["iframe", true]] as const) {
  const output = buildDocument(pairFragment, { ...common, embed, charts: pairCharts });
  check(
    `${label} expands two chart holes`,
    !output.includes("data-chart=") &&
      (output.match(/<figure class="ig-chart ig-chart--/g) ?? []).length === 2 &&
      output.includes(renderChart(line as never, { locale: "es" })) &&
      output.includes(renderChart(treemap as never, { locale: "es" })),
  );
}
const twice = buildDocument(hole(String(line.id)) + hole(String(line.id)), {
  ...common,
  embed: false,
  charts: [line],
});
const ids = [...twice.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
check(
  "reused spec expands with unique DOM ids",
  (twice.match(/<figure class="ig-chart ig-chart--/g) ?? []).length === 2 &&
    ids.length === new Set(ids).size,
);
const invalid = { ...line, title: "" };
check(
  "missing, invalid and duplicate charts rejected",
  throws(() => buildDocument(hole(String(line.id)), { ...common, embed: false })) &&
    throws(() =>
      buildDocument(hole(String(line.id)), { ...common, embed: false, charts: [invalid] }),
    ) &&
    throws(() => buildDocument("", { ...common, embed: false, charts: [line, line] })),
);
const withEmptyCharts = buildDocument(fragment, { ...common, embed: false, charts: [] });
check("no holes unchanged with or without charts", standalone === withEmptyCharts);

const lineEn = fixture("line.projected.en.json");
const enOutput = buildDocument(hole(String(lineEn.id)), {
  ...common,
  locale: "en",
  embed: false,
  charts: [lineEn],
});
check(
  "English chart text and number formatting",
  enOutput.includes("Pension spending to 2050") && enOutput.includes("11.2%"),
);
const hostile = { ...line, title: "</style><script>alert(1)</script>" };
const hostileOutput = buildDocument(hole(String(line.id)), {
  ...common,
  embed: false,
  charts: [hostile],
});
check(
  "chart text is escaped before composition",
  !hostileOutput.includes("<script") &&
    hostileOutput.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
);

const showcaseNames = [
  "line.projected.es.json",
  "column.es.json",
  "stacked.columns.absolute.es.json",
  "donut.es.json",
  "pictogram.hundred.es.json",
  "scatter.dense.es.json",
  "ranking.fifteen.es.json",
  "treemap.es.json",
];
const showcase = showcaseNames.map(fixture);
const showcaseFragment = showcase.map((spec) => hole(String(spec.id))).join("");
const showcaseStandalone = buildDocument(showcaseFragment, {
  ...common,
  theme: "auto",
  embed: false,
  charts: showcase,
});
const showcaseIframe = buildDocument(showcaseFragment, {
  ...common,
  theme: "auto",
  embed: true,
  charts: showcase,
});
const standaloneKb = Buffer.byteLength(standalone) / 1024;
const iframeKb = Buffer.byteLength(iframe) / 1024;
console.log(`Size: standalone ${standaloneKb.toFixed(1)} KB; iframe ${iframeKb.toFixed(1)} KB`);
check("standalone below 400 KB", standaloneKb <= 400);
const showcaseStandaloneKb = Buffer.byteLength(showcaseStandalone) / 1024;
const showcaseIframeKb = Buffer.byteLength(showcaseIframe) / 1024;
const baseStandaloneKb = Buffer.byteLength(
  buildDocument("", { ...common, theme: "auto", embed: false }),
) / 1024;
const baseIframeKb =
  Buffer.byteLength(buildDocument("", { ...common, theme: "auto", embed: true })) / 1024;
console.log(
  `Showcase (8): standalone ${showcaseStandaloneKb.toFixed(1)} KB ` +
    `(+${((showcaseStandaloneKb - baseStandaloneKb) / showcase.length).toFixed(1)} KB/chart); ` +
    `iframe ${showcaseIframeKb.toFixed(1)} KB ` +
    `(+${((showcaseIframeKb - baseIframeKb) / showcase.length).toFixed(1)} KB/chart)`,
);
check("8-chart standalone below 400 KB", showcaseStandaloneKb <= 400);
if (process.argv[2]) {
  const out = path.resolve(process.argv[2]);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "infographic-standalone.html"), standalone);
  writeFileSync(path.join(out, "infographic-iframe.html"), iframe);
  writeFileSync(path.join(out, "infographic-charts-standalone.html"), showcaseStandalone);
  writeFileSync(path.join(out, "infographic-charts-iframe.html"), showcaseIframe);
}
process.exitCode = failures === 0 ? 0 : 1;
