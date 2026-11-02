import { readdir, readFile } from "node:fs/promises";
import { validateChartSpec } from "../../design-system/charts/schema/index.ts";

const root = new URL("../../design-system/charts/fixtures/", import.meta.url);
let failed = 0;
let total = 0;

function reviveFixtureValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reviveFixtureValue);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.$repeat === "string" && typeof record.count === "number") {
    return record.$repeat.repeat(record.count);
  }
  if (record.$number === "NaN") {
    return Number.NaN;
  }
  if (record.$number === "Infinity") {
    return Number.POSITIVE_INFINITY;
  }
  if (record.$number === "-Infinity") {
    return Number.NEGATIVE_INFINITY;
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [key, reviveFixtureValue(child)]),
  );
}

for (const kind of ["valid", "invalid"]) {
  const directory = new URL(`${kind}/`, root);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
  for (const file of files) {
    total++;
    const json = await readFile(new URL(file, directory), "utf8");
    const input = reviveFixtureValue(JSON.parse(json) as unknown);
    const result = validateChartSpec(input);
    let pass = kind === "valid" ? result.ok : !result.ok;
    if (kind === "invalid") {
      const expectedFile = file.replace(/\.json$/, ".expect");
      const expected = (await readFile(new URL(expectedFile, directory), "utf8")).trim();
      pass = !result.ok && result.issues.some((issue) => issue.code === expected);
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
