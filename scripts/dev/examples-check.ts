import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFragment } from "../../design-system/infographic/validate.ts";
import { buildDocument } from "../../design-system/infographic/render.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const examples = path.resolve(here, "../../design-system/examples");
const output = process.argv[2];
const roots = ["ig-header", "ig-section", "ig-card", "ig-grid", "ig-verdict",
  "ig-footer", "ig-callout", "ig-options", "ig-bar-chart", "ig-stat", "ig-change",
  "ig-timeline"];
const variants = ["ig-card--feature", "ig-card--deep", "ig-callout--neutral",
  "ig-bar-chart__row--projected", "ig-bar-chart__row--series-2", "ig-change--worse",
  "ig-timeline__item--now"];
let failed = false;
const check = (label: string, pass: boolean): void => {
  console.log(`${pass ? "OK" : "FAIL"} ${label}`);
  if (!pass) failed = true;
};
const files = (await readdir(examples)).filter((name) => name.endsWith(".html")).sort();
const contents = new Map<string, string>();
for (const file of files) {
  const html = await readFile(path.join(examples, file), "utf8");
  contents.set(file, html);
  const result = validateFragment(html);
  check(`${file} validates`, result.ok);
  if (!result.ok) console.error(result.issues);
  for (const root of roots) check(`${file} contains ${root}`,
    new RegExp(`class="[^"]*\\b${root}\\b`).test(html));
  for (const variant of variants) check(`${file} contains ${variant}`,
    html.includes(variant));
}
const es = contents.get("pensiones.es.html") ?? "";
const en = contents.get("pensiones.en.html") ?? "";
const classes = (html: string): string[] => [...html.matchAll(/class="([^"]+)"/g)]
  .flatMap((match) => match[1].split(/\s+/)).sort();
const numbers = (html: string): string[] => {
  const visible = html.replace(/<[^>]*>/g, " ").replace(/&rarr;/g, " ");
  return [...visible.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((match) => match[0].replace(",", "."));
};
check("ES and EN class sets match",
  JSON.stringify(classes(es)) === JSON.stringify(classes(en)));
check("ES and EN visible numbers match",
  JSON.stringify(numbers(es)) === JSON.stringify(numbers(en)));
if (output !== undefined) {
  await mkdir(output, { recursive: true });
  for (const [file, locale, title] of [
    ["pensiones.es.html", "es", "Pensiones"],
    ["pensiones.en.html", "en", "Pensions"],
  ] as const) {
    const doc = buildDocument(contents.get(file) ?? "", {
      embed: false, theme: "light", dsVersion: "1.0.0", locale, title,
    });
    await writeFile(path.join(output, file), doc);
  }
  check("self-contained documents written", true);
}
if (failed) process.exitCode = 1;
