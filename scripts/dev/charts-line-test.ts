// Failure modes: equal values; all null except one; singleton; mixed signs; 1e9 and 0.003;
// uneven years; projection at zero and last index; leading/trailing gaps; coincident ends;
// grouped years; displaced final dots; excessive vertical padding; missing table values;
// nonfinite or out-of-range coordinates; bridges across null values.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { renderLine } from "../../design-system/charts/render/line.ts";
import type { LineSpec } from "../../design-system/charts/schema/index.ts";
import { formatValue } from "../../design-system/charts/format.ts";
import { validateChartSpec } from "../../design-system/charts/index.ts";

const base: LineSpec = {
  id: "line-test", type: "line", title: "Test", sourceQuote: "Example",
  x: { kind: "year", values: [2000, 2005, 2050] },
  series: [{ name: "Series", values: [1, 2, 3] }],
};
const cases = [
  [5, 5, 5], [null, 7, null], [0], [-5, 0, 8], [1e9, 0.003, 0],
  [null, 2, 3], [2, 3, null], [null, null, null],
];
let checks = 0;
for (const values of cases) {
  const spec = structuredClone(base);
  spec.x.values = spec.x.values.slice(0, values.length);
  spec.series[0].values = values;
  const html = renderLine(spec, { locale: "es" });
  assert(!/NaN|Infinity/.test(html));
  for (const match of html.matchAll(/(?:left|top|width|height):([\d.-]+)%/g)) {
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  for (const match of html.matchAll(/(?:x1|x2|y1|y2)="([\d.-]+)"/g)) {
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  const table = html.slice(html.indexOf("<table"));
  assert.equal([...table.matchAll(/<td>/g)].length, values.length);
  assert.equal([...html.matchAll(/class="ig-chart__line-dot /g)].length,
    values.filter((v) => v !== null).length * 2);
  for (const value of values) {
    if (value !== null) assert(table.includes(formatValue(value, "es")));
  }
  checks++;
}
for (const locale of ["es", "en"] as const) {
  const html = renderLine(base, { locale });
  assert(html.includes(">2000</span>"));
  assert(html.includes(">2050</span>"));
  assert(html.includes('<th scope="row">2005</th>'));
  assert(!html.includes("2,000") && !html.includes("2.000"));
  assert(!html.includes("line-dot-last"));
  assert(html.includes('y1="92" y2="92"'));
  assert(html.includes('top:96%'));
  checks++;
}
const irregular = renderLine(base, { locale: "en" });
assert(irregular.includes('x2="10"'));
for (const projectedFrom of [0, 2]) {
  const spec = structuredClone(base);
  spec.series[0].projectedFrom = projectedFrom;
  const html = renderLine(spec, { locale: "en" });
  const dashed = [...html.matchAll(/class="ig-chart__line-stroke[^\"]*projected/g)];
  assert.equal(dashed.length, projectedFrom === 0 ? 4 : 2);
  assert(html.includes("projected</td>"));
  checks++;
}

const fixtureDir = path.resolve("design-system/charts/fixtures/valid");
const lineFixtures = readdirSync(fixtureDir).filter((file) => /^line\..+\.json$/.test(file));
function attributes(markup: string): Record<string, string> {
  return Object.fromEntries([...markup.matchAll(/([a-z]+)="([^"]+)"/g)]
    .map((match) => [match[1], match[2]]));
}
function box(style: string, end: boolean) {
  const values = Object.fromEntries([...style.matchAll(/(left|top|width|height):([\d.]+)%/g)]
    .map((match) => [match[1], Number(match[2])])) as Record<string, number>;
  const left = values.left - (end ? values.width : 0);
  return { left, right: left + values.width, top: values.top, bottom: values.top + values.height };
}
function intersects(markup: string, bounds: ReturnType<typeof box>): boolean {
  for (const match of markup.matchAll(/<line class="ig-chart__line-stroke[^>]*\/>/g)) {
    const attr = attributes(match[0]);
    const x1 = Number(attr.x1), x2 = Number(attr.x2);
    const y1 = Number(attr.y1), y2 = Number(attr.y2);
    const start = Math.max(bounds.left, Math.min(x1, x2));
    const end = Math.min(bounds.right, Math.max(x1, x2));
    for (let sample = start; sample <= end; sample += 0.5) {
      const ratio = (sample - x1) / (x2 - x1);
      const yValue = y1 + (y2 - y1) * ratio;
      if (yValue >= bounds.top && yValue <= bounds.bottom) return true;
    }
  }
  return false;
}
for (const fixture of lineFixtures) {
  const spec = JSON.parse(readFileSync(path.join(fixtureDir, fixture), "utf8")) as unknown;
  const valid = validateChartSpec(spec);
  assert(valid.ok, `${fixture} must validate`);
  const locale = fixture.endsWith(".en.json") ? "en" : "es";
  const html = renderLine(valid.spec as LineSpec, { locale });
  for (const bandName of ["wide", "narrow"]) {
    const bandMarkup = html.split(`ig-chart__${bandName}">`)[1].split("</div>")[0];
    const labelPattern = /<span[^>]*class="[^"]*ig-chart__line-(?:first|end)[^"]*"[^>]*>/g;
    const labels = [...bandMarkup.matchAll(labelPattern)];
    for (const label of labels) {
      const cls = attributes(label[0]).class;
      const end = cls.includes("line-end");
      assert(!intersects(bandMarkup, box(attributes(label[0]).style, end)),
        `${fixture} ${bandName} ${cls} overlaps a series segment`);
      checks++;
    }
  }
}
const projection = structuredClone(base);
projection.series[0].projectedFrom = 2;
const projectionHtml = renderLine(projection, { locale: "en" });
assert(projectionHtml.includes(
  'ig-chart__line-projected" x1="10" x2="100"',
));
const gaps = structuredClone(base);
gaps.series[0].values = [1, null, 3];
assert(!renderLine(gaps, { locale: "en" }).includes('class="ig-chart__line-stroke'));
const crowded = structuredClone(base);
crowded.series = Array.from({ length: 4 }, (_, i) => ({ name: `Series ${i}`, values: [i, 2, 5] }));
const crowdedHtml = renderLine(crowded, { locale: "en" });
const ends = [...crowdedHtml.matchAll(/line-end[^>]*top:([\d.]+)%/g)].slice(0, 4);
assert.equal(new Set(ends.map((m) => m[1])).size, 4);
console.log(`charts-line-test: ${checks + 3} checks passed, 0 failures`);
