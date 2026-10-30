import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chartReferences,
  validateFragment,
} from "../../design-system/infographic/validate.ts";
import { buildDocument } from "../../design-system/infographic/render.ts";
import { validateChartSpec } from "../../design-system/charts/index.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const examples = process.env.EXAMPLES_DIR
  ? path.resolve(process.env.EXAMPLES_DIR)
  : path.resolve(here, "../../design-system/examples");
const output = process.argv[2];
const roots = ["ig-header", "ig-section", "ig-card", "ig-grid", "ig-verdict",
  "ig-footer", "ig-callout", "ig-options", "ig-bar-chart", "ig-stat", "ig-change",
  "ig-timeline", "ig-chart"];
const variants = ["ig-card--feature", "ig-card--deep", "ig-callout--neutral",
  "ig-bar-chart__row--projected", "ig-bar-chart__row--series-2", "ig-change--worse",
  "ig-timeline__item--now"];
const themes = ["light", "dark", "auto"] as const;
type Locale = "es" | "en";
type Example = { html: string; specs: unknown[]; refs: string[] };
let failed = false;
const check = (label: string, pass: boolean): void => {
  console.log(`${pass ? "OK" : "FAIL"} ${label}`);
  if (!pass) failed = true;
};
const files = (await readdir(examples)).sort();
const htmlFiles = files.filter((name) => /^[a-z][a-z0-9-]*\.(es|en)\.html$/.test(name));
const names = [...new Set(htmlFiles.map((file) => file.replace(/\.(es|en)\.html$/, "")))];
const allHtml: string[] = [];
const examplesByPair = new Map<string, Example>();
const classes = (html: string): string[] => [...html.matchAll(/class="([^"]+)"/g)]
  .flatMap((match) => match[1].split(/\s+/)).sort();
const numbers = (html: string): string[] => {
  const visible = html.replace(/<[^>]*>/g, " ").replace(/&rarr;/g, " ");
  return [...visible.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((match) => match[0].replace(",", "."));
};
const numericValues = (value: unknown): number[] => {
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value.flatMap(numericValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(numericValues);
  }
  return [];
};
const titleFrom = (html: string): string =>
  html.match(/<h1 class="ig-header__title">([\s\S]*?)<\/h1>/)?.[1]
    .replace(/<[^>]*>/g, "").trim() ?? "Infographic";

for (const name of names) {
  const pair = new Map<Locale, Example>();
  for (const locale of ["es", "en"] as const) {
    const file = `${name}.${locale}.html`;
    check(`${file} exists`, htmlFiles.includes(file));
    if (!htmlFiles.includes(file)) continue;
    const html = await readFile(path.join(examples, file), "utf8");
    allHtml.push(html);
    const result = validateFragment(html);
    check(`${file} validates`, result.ok);
    if (!result.ok) console.error(result.issues);
    for (const tag of ["ig-header", "ig-section", "ig-footer"]) {
      check(`${file} contains ${tag}`,
        new RegExp(`<[^>]*class="[^"]*\\b${tag}\\b`).test(html));
    }
    const specFile = `${name}.charts.${locale}.json`;
    const specs = files.includes(specFile)
      ? JSON.parse(await readFile(path.join(examples, specFile), "utf8")) as unknown[]
      : [];
    check(`${specFile} is an array`, Array.isArray(specs));
    const refs = chartReferences(html);
    const ids: string[] = [];
    for (const [index, spec] of specs.entries()) {
      const result = validateChartSpec(spec);
      check(`${specFile} spec ${index + 1} validates`, result.ok);
      if (result.ok) ids.push(result.spec.id);
      else console.error(result.issues);
    }
    check(`${file} chart references have specs`, refs.every((id) => ids.includes(id)));
    check(`${specFile} specs are all used`, ids.every((id) => refs.includes(id)));
    pair.set(locale, { html, specs, refs });
    examplesByPair.set(`${name}.${locale}`, { html, specs, refs });
  }
  const es = pair.get("es");
  const en = pair.get("en");
  if (es && en) {
    check(`${name} ES/EN class sets match`,
      JSON.stringify(classes(es.html)) === JSON.stringify(classes(en.html)));
    check(`${name} ES/EN visible numbers match`,
      JSON.stringify(numbers(es.html)) === JSON.stringify(numbers(en.html)));
    const specIds = (value: Example): string[] => value.specs.flatMap((spec) => {
      const result = validateChartSpec(spec);
      return result.ok ? [result.spec.id] : [];
    });
    const esIds = specIds(es);
    const enIds = specIds(en);
    check(`${name} ES/EN chart hole order matches`,
      JSON.stringify(es.refs) === JSON.stringify(en.refs));
    check(`${name} ES/EN spec ids match`, JSON.stringify(esIds) === JSON.stringify(enIds));
    const specById = (value: Example, id: string): unknown => value.specs.find((spec) => {
      const result = validateChartSpec(spec);
      return result.ok && result.spec.id === id;
    });
    for (const id of esIds) {
      const esResult = validateChartSpec(specById(es, id));
      const enResult = validateChartSpec(specById(en, id));
      check(`${name} chart ${id} type matches`,
        esResult.ok && enResult.ok && esResult.spec.type === enResult.spec.type);
      check(`${name} chart ${id} numeric data matches`,
        esResult.ok && enResult.ok &&
        JSON.stringify(numericValues(esResult.spec)) ===
          JSON.stringify(numericValues(enResult.spec)));
    }
  }
}
const union = allHtml.join("\n");
for (const root of roots) {
  check(`examples contain ${root}`,
    new RegExp(`class="[^"]*\\b${root}\\b`).test(union));
}
for (const variant of variants) {
  check(`examples contain ${variant}`, union.includes(variant));
}
if (output !== undefined) {
  await mkdir(output, { recursive: true });
  for (const name of names) for (const locale of ["es", "en"] as const) {
    const example = examplesByPair.get(`${name}.${locale}`);
    if (!example) continue;
    for (const theme of themes) {
      const doc = buildDocument(example.html, {
        embed: false,
        theme,
        dsVersion: "1.0.0",
        locale,
        title: titleFrom(example.html),
        charts: example.specs,
      });
      const count = example.refs.length;
      const figures = [...doc.matchAll(/<figure class="ig-chart /g)].length;
      const file = `${name}.${locale}.${theme}.html`;
      check(`${file} expands ${count} chart(s)`,
        !doc.includes("data-chart=") && figures === count);
      console.log(`${file}: ${(Buffer.byteLength(doc) / 1024).toFixed(1)} KB`);
      await writeFile(path.join(output, file), doc);
      console.log(`Wrote ${path.join(output, file)}`);
    }
  }
}
if (failed) process.exitCode = 1;
