import { readdir, readFile } from "node:fs/promises";
import { chartReferences, validateFragment } from "../../design-system/infographic/validate.ts";

const root = new URL("../../design-system/infographic/fixtures/", import.meta.url);
let failed = 0;
let total = 0;
for (const kind of ["valid", "invalid"]) {
  const dir = new URL(`${kind}/`, root);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".html"));
  for (const file of files) {
    total++;
    const html = await readFile(new URL(file, dir), "utf8");
    const result = validateFragment(html);
    let pass = kind === "valid" ? result.ok : !result.ok;
    if (kind === "invalid") {
      const expectedFile = file.replace(/\.html$/, ".expect");
      const expected = (await readFile(new URL(expectedFile, dir), "utf8")).trim();
      pass = !result.ok && result.issues.some((issue) => issue.code === expected);
    }
    if (kind === "valid") {
      const expected = Array.from(
        html.matchAll(/data-chart="([a-z][a-z0-9-]{0,31})"/g),
        (match) => match[1],
      );
      pass &&= JSON.stringify(chartReferences(html)) === JSON.stringify(expected);
    } else {
      let threw = false;
      try {
        chartReferences(html);
      } catch (error) {
        threw = error instanceof Error;
      }
      pass &&= threw;
    }
    console.log(`${pass ? "OK" : "FAIL"} ${kind}/${file}`);
    if (!pass) {
      failed++;
    }
  }
}
console.log(`${total - failed}/${total} fixtures passed`);
if (failed) {
  process.exitCode = 1;
}
