import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildDocument } from "../../design-system/infographic/render.ts";

const fragment =
  '<header class="ig-header"><h1 class="ig-header__title">Example</h1></header>' +
  '<div class="ig-stat"><p class="ig-stat__value">2</p></div>';
let failures = 0;
function check(name: string, condition: boolean): void {
  console.log(`${condition ? "OK" : "FAIL"} ${name}`);
  if (!condition) {
    failures += 1;
  }
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
const standaloneKb = Buffer.byteLength(standalone) / 1024;
const iframeKb = Buffer.byteLength(iframe) / 1024;
console.log(
  `Size: standalone ${standaloneKb.toFixed(1)} KB; iframe ${iframeKb.toFixed(1)} KB`,
);
check("standalone below 400 KB", standaloneKb <= 400);
if (process.argv[2]) {
  const out = path.resolve(process.argv[2]);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "infographic-standalone.html"), standalone);
  writeFileSync(path.join(out, "infographic-iframe.html"), iframe);
}
process.exitCode = failures === 0 ? 0 : 1;
