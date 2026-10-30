// Usage: node scripts/dev/charts-render-test.ts
// Contract checks shared by every implemented chart type (CHART_LIBRARY_PLAN.md §3, §6 "Render"):
// determinism, escaping of every spec string, no literal colors, numeric-only inline styles,
// container and accessible table. Types that still throw NotImplementedError are skipped.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  NotImplementedError,
  renderChart,
  validateChartSpec,
} from "../../design-system/charts/index.ts";
import type { ChartSpec } from "../../design-system/charts/index.ts";

const fixtures = path.resolve("design-system/charts/fixtures/valid");
const TEXT_KEYS = new Set(["title", "description", "note", "label", "name", "period"]);
const HOSTILE = `<i>&"x'</i>`;
let failed = 0;
let passed = 0;
const skipped = new Set<string>();

function fail(file: string, message: string): void {
  console.error(`FAIL ${file}: ${message}`);
  failed++;
}

// Numbered, so specs that require unique labels still validate.
let hostileCount = 0;
function hostile(value: unknown, key = ""): unknown {
  if (typeof value === "string" && TEXT_KEYS.has(key)) return `${HOSTILE}${hostileCount++}`;
  if (Array.isArray(value)) return value.map((item) => hostile(item));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, hostile(child, childKey)]),
    );
  }
  return value;
}

function checkMarkup(file: string, spec: ChartSpec, markup: string): void {
  if (!markup.startsWith(`<figure class="ig-chart ig-chart--${spec.type}">`)) {
    fail(file, "output does not start with the ig-chart figure");
  }
  if (!markup.includes('class="ig-chart__body" role="img"')) fail(file, "missing role=img body");
  if (!markup.includes('<table class="ig-chart__table">')) fail(file, "missing accessible table");
  if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/.test(markup)) fail(file, "literal color");
  if (/<script|<style|\son[a-z]+=|javascript:/i.test(markup)) fail(file, "executable markup");
  for (const match of markup.matchAll(/\sstyle="([^"]*)"/g)) {
    const ok = match[1]
      .split(";")
      .every((rule) => /^(--[a-z0-9-]+|[a-z-]+):-?\d+(\.\d+)?(%|px)?$/.test(rule));
    if (!ok) fail(file, `non-numeric inline style: ${match[1]}`);
  }
  const classes = [...markup.matchAll(/\sclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
  const foreign = classes.filter((name) => !/^ig-chart(__|--|$)/.test(name));
  if (foreign.length > 0) fail(file, `classes outside ig-chart: ${[...new Set(foreign)]}`);
}

for (const file of readdirSync(fixtures).filter((name) => name.endsWith(".json")).sort()) {
  const raw = JSON.parse(readFileSync(path.join(fixtures, file), "utf8")) as unknown;
  const result = validateChartSpec(raw);
  if (!result.ok) {
    fail(file, "fixture does not validate");
    continue;
  }
  const locale = file.endsWith(".en.json") ? "en" : "es";
  let markup: string;
  try {
    markup = renderChart(result.spec, { locale });
  } catch (error) {
    if (error instanceof NotImplementedError) {
      skipped.add(result.spec.type);
      continue;
    }
    fail(file, `throws ${(error as Error).message}`);
    continue;
  }
  const before = failed;
  if (renderChart(structuredClone(result.spec), { locale }) !== markup) {
    fail(file, "not deterministic");
  }
  checkMarkup(file, result.spec, markup);
  hostileCount = 0;
  const hostileSpec = validateChartSpec(hostile(raw));
  if (hostileSpec.ok) {
    const escaped = renderChart(hostileSpec.spec, { locale });
    if (escaped.includes("<i>") || escaped.includes(`"x'`)) fail(file, "spec text not escaped");
    if (!escaped.includes("&lt;i&gt;&amp;&quot;x&#39;&lt;/i&gt;")) {
      fail(file, "hostile text missing from output");
    }
    checkMarkup(`${file} (hostile)`, hostileSpec.spec, escaped);
  } else {
    fail(file, `hostile variant does not validate: ${JSON.stringify(hostileSpec.issues[0])}`);
  }
  if (failed === before) passed++;
}

console.log(`charts-render-test: ${passed} fixtures passed, ${failed} failure(s)`);
if (skipped.size > 0) console.log(`Skipped (not implemented): ${[...skipped].sort().join(", ")}`);
if (failed > 0) process.exit(1);
