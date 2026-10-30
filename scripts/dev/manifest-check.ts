import { ALLOWED_CLASSES } from "../../design-system/infographic/manifest.ts";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const cssDirectory = "design-system/infographic/css";
const files = (await readdir(cssDirectory)).filter((file) => file.endsWith(".css"));
const cssClasses = new Set<string>();

// charts.css styles the chart hole; its ig-chart__* classes are render output, never agent input.
const sources = [
  ...files.map((file) => join(cssDirectory, file)),
  "design-system/charts/css/charts.css",
];

for (const source of sources) {
  const css = await readFile(source, "utf8");
  for (const match of css.matchAll(/\.ig-[a-z0-9_-]+/g)) {
    const className = match[0].slice(1);
    if (className !== "ig-root" && !className.startsWith("ig-chart__")) {
      cssClasses.add(className);
    }
  }
}

const missing = [...cssClasses].filter((className) => !ALLOWED_CLASSES.has(className));
const extra = [...ALLOWED_CLASSES].filter((className) => !cssClasses.has(className));

if (missing.length > 0 || extra.length > 0) {
  console.error(
    `Manifest mismatch. Missing: ${missing.join(", ") || "none"}; ` +
      `extra: ${extra.join(", ") || "none"}`,
  );
  process.exit(1);
}

console.log(`OK ${cssClasses.size} classes`);
