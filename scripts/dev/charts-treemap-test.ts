// Failure modes: singleton; 99% dominant; tiny items; singleton groups; non-100 total;
// extreme aspect ratios; gaps, overlaps, out-of-bounds or nonproportional areas;
// nondeterminism; disconnected groups; missing visible/table data; labels on data-6;
// incorrect highlight, soft highlight leaking into data-tone groups or negative emphasis.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { layoutTreemap } from "../../design-system/charts/layout/treemap.ts";
import { renderTreemap } from "../../design-system/charts/render/treemap.ts";
import { treemapSpecSchema } from "../../design-system/charts/schema/treemap.ts";
import { escapeHtml } from "../../design-system/charts/render/shared.ts";
import { formatValue } from "../../design-system/charts/format.ts";

const dir = "design-system/charts/fixtures/valid";
let cases = 0;
for (const file of readdirSync(dir).filter((name) => /^treemap\..*json$/.test(name))) {
  const spec = treemapSpecSchema.parse(JSON.parse(readFileSync(`${dir}/${file}`, "utf8")));
  for (const ratio of [1, 481 / 300, 280 / 320, 10, 0.1]) {
    const result = layoutTreemap(spec.items, ratio);
    assert.deepEqual(result, layoutTreemap(spec.items, ratio));
    const total = spec.items.reduce((sum, item) => sum + item.value, 0);
    assert.equal(result.items.length, spec.items.length);
    let area = 0;
    for (const rect of result.items) {
      assert(rect.x >= -1e-8 && rect.y >= -1e-8);
      assert(rect.x + rect.w <= 100 + 1e-8 && rect.y + rect.h <= 100 + 1e-8);
      const expected = spec.items[rect.index].value / total * 10000;
      assert(Math.abs(rect.w * rect.h / expected - 1) < 0.01);
      area += rect.w * rect.h / 100;
      const group = result.groups.find((box) => box.group === spec.items[rect.index].group)!;
      assert(rect.x >= group.x - 1e-8 && rect.y >= group.y - 1e-8);
      assert(rect.x + rect.w <= group.x + group.w + 1e-8);
      assert(rect.y + rect.h <= group.y + group.h + 1e-8);
    }
    assert(Math.abs(area - 100) < 0.01);
    for (let i = 0; i < result.items.length; i++) {
      for (const b of result.items.slice(i + 1)) {
        const a = result.items[i];
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        assert(w <= 1e-8 || h <= 1e-8);
      }
    }
    cases++;
  }
  const locale = file.endsWith(".en.json") ? "en" : "es";
  const html = renderTreemap(spec, { locale });
  const [body, table] = html.split('<table class="ig-chart__table">');
  const plotWrappers = [...body.matchAll(
    /<div class="([^"]+)"[^>]*><div class="ig-chart__plot\b/g,
  )].map((match) => match[1].split(" "));
  for (const width of [360, 600, 800]) {
    const visible = plotWrappers.filter((classes) => {
      const narrow = classes.includes("ig-chart__narrow");
      const wide = classes.includes("ig-chart__wide");
      const md = classes.includes("ig-chart__treemap-md");
      const xl = classes.includes("ig-chart__treemap-xl");
      if (width <= 480) return narrow;
      if (narrow || !wide) return false;
      if (xl) return width >= 720;
      if (md) return width >= 481 && width < 720;
      return true;
    });
    assert.equal(visible.length, 1, `${file}: ${width}px has exactly one plot wrapper`);
  }
  for (const variant of ["md", "xl", "narrow"]) {
    const marker = variant === "narrow" ? 'class="ig-chart__narrow"'
      : `class="ig-chart__wide ig-chart__treemap-${variant}"`;
    const start = body.indexOf(marker);
    if (start < 0) continue;
    const nextMarkers = ['class="ig-chart__wide ig-chart__treemap-xl"',
      'class="ig-chart__narrow"'].filter((next) => body.indexOf(next, start + marker.length) >= 0)
      .map((next) => body.indexOf(next, start + marker.length));
    const visible = body.slice(start, nextMarkers.length ? Math.min(...nextMarkers) : undefined);
    for (const item of spec.items) {
      assert(visible.includes(escapeHtml(item.label)), `${file}: visible ${item.label}`);
      assert(visible.includes(escapeHtml(formatValue(item.value, locale, spec.unit))));
      assert(table.includes(escapeHtml(item.label)));
      assert(table.includes(escapeHtml(formatValue(item.value, locale, spec.unit))));
    }
  }
  assert.equal(renderTreemap(spec, { locale }), html, `${file}: deterministic`);
  for (const cell of html.matchAll(/<div class="ig-chart__cell ([^"]+)"[^>]*>([\s\S]*?)<\/div>/g)) {
    if (cell[1].includes("ig-chart__s6")) assert.equal(cell[2], "");
  }
  if (spec.items.some((item) => item.emphasis === "highlight")) {
    assert(html.includes("ig-chart__highlight"));
    if (file.startsWith("treemap.es.") || file === "treemap.es.json" ||
      file === "treemap.en.json") {
      assert(html.includes("ig-chart__highlight-soft"));
    }
  }
}
const emphasis = treemapSpecSchema.parse({
  id: "emphasis", type: "treemap", title: "Emphasis", sourceQuote: "Synthetic",
  groups: [{ id: "g", label: "Group", tone: "data-2" }],
  items: [
    { label: "Highlighted", value: 40, group: "g", emphasis: "highlight" },
    { label: "Sibling", value: 35, group: "g" },
    { label: "Negative", value: 25, group: "g", emphasis: "negative" },
  ],
});
const emphHtml = renderTreemap(emphasis, { locale: "en" });
function assertCellColor(html: string, label: string, color: string) {
  const cells = [...html.matchAll(
    /<div class="ig-chart__cell ([^"]+)"[^>]*>([\s\S]*?)<\/div>/g,
  )].filter((cell) => cell[2].includes(label));
  assert.equal(cells.length, 2, `${label}: labelled in both bands`);
  assert(cells.every((cell) => cell[1] === `ig-chart__${color}`));
}
for (const [label, color] of [
  ["Highlighted", "highlight"], ["Sibling", "s2"], ["Negative", "negative"],
]) {
  assertCellColor(emphHtml, label, color);
}
assert(!emphHtml.includes("ig-chart__highlight-soft"));
const highlightedGroup = renderTreemap({
  ...emphasis,
  groups: [{ id: "g", label: "Group", tone: "highlight" }],
}, { locale: "en" });
assertCellColor(highlightedGroup, "Highlighted", "highlight");
assertCellColor(highlightedGroup, "Sibling", "highlight-soft");
assertCellColor(highlightedGroup, "Negative", "negative");
const mixed = [
  { value: 5, group: "b" }, { value: 5, group: "a" }, { value: 90 },
];
const grouped = layoutTreemap(mixed, 1);
assert.deepEqual(grouped.groups.map((group) => group.group), ["b", "a", undefined]);
assert.deepEqual(grouped.items.map((item) => item.index), [0, 1, 2]);
console.log(`charts-treemap-test: ${cases} geometry cases, visible/table data passed`);

const spanish = treemapSpecSchema.parse(JSON.parse(
  readFileSync(`${dir}/treemap.es.json`, "utf8"),
));
const spanishHtml = renderTreemap(spanish, { locale: "es" });
const mdStart = spanishHtml.indexOf('class="ig-chart__wide ig-chart__treemap-md"');
const xlStart = spanishHtml.indexOf('class="ig-chart__wide ig-chart__treemap-xl"');
const narrowStart = spanishHtml.indexOf('class="ig-chart__narrow"');
const mdCells = spanishHtml.slice(mdStart, xlStart < 0 ? narrowStart : xlStart);
const xlCells = spanishHtml.slice(xlStart, narrowStart);
const mdCount = [...mdCells.matchAll(/class="ig-chart__label"/g)].length;
const xlCount = [...xlCells.matchAll(/class="ig-chart__label"/g)].length;
assert(xlCount > mdCount, `xl labels ${xlCount} > md labels ${mdCount}`);
const alsoCount = (variant: string) => {
  const also = variant.match(/<div class="ig-chart__also">[\s\S]*?<\/div>/)?.[0] ?? "";
  return (also.match(/<li>/g) ?? []).length;
};
assert(alsoCount(xlCells) < alsoCount(mdCells), "xl also list is shorter");
assert.equal((spanishHtml.match(/<tr\b/g) ?? []).length, spanish.items.length + 1);
