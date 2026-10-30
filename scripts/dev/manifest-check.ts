import { ALLOWED_CLASSES } from "../../design-system/infographic/manifest.ts";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const cssDirectory = "design-system/infographic/css";
const files = (await readdir(cssDirectory)).filter((file) => file.endsWith(".css"));
const cssClasses = new Set<string>();

for (const file of files) {
  const css = await readFile(join(cssDirectory, file), "utf8");
  for (const match of css.matchAll(/\.ig-[a-z0-9_-]+/g)) {
    const className = match[0].slice(1);
    if (className !== "ig-root") {
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
