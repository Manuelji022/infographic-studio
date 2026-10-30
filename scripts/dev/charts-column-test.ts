// Failure modes: all zero; one value; mixed signs; 1e9 and 0.003; zero percent total;
// tiny segments; 12 × 4 columns; nonfinite/negative geometry; overlapping groups;
// percent geometry not summing to 100; values missing from visible text or table.
// Repeated column plots per band; dense data not falling back; values in a fixed column.
// Segment values duplicated in legends; multiple general legends; missing fallback values.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { renderColumn } from "../../design-system/charts/render/column.ts";
import { renderStacked } from "../../design-system/charts/render/stacked.ts";
import { formatValue } from "../../design-system/charts/format.ts";
import type { ColumnSpec, StackedSpec } from "../../design-system/charts/schema/index.ts";

const base = { id: "test", title: "Test", sourceQuote: "Test" };
const cases = [[0], [7], [-12, 18, -3], [1e9, 0.003], Array(12).fill(1234)];
let count = 0;
for (const values of cases) {
  for (const seriesCount of [1, 4]) {
    const spec: ColumnSpec = {
      ...base, type: "column", categories: values.map((_, i) => `Category ${i}`),
      series: Array.from({ length: seriesCount }, (_, i) => ({ name: `S${i}`, values })),
    };
    const html = renderColumn(spec, { locale: "en" });
    check(html, values);
    for (const svg of html.matchAll(/<svg[^>]*>(.*?)<\/svg>/g)) {
      let previousRight = 0;
      for (const rect of svg[1].matchAll(/<rect[^>]*x="([\d.]+)"[^>]*width="([\d.]+)"/g)) {
        const left = Number(rect[1]);
        assert(left + 0.002 >= previousRight, "columns overlap");
        previousRight = left + Number(rect[2]);
      }
    }
    count++;
  }
}
for (const values of [[0, 0], [0.1, 99.9], [30, 70], [1e9, 0.003]]) {
  for (const layout of ["bar", "columns"] as const) {
    const spec: StackedSpec = {
      ...base, type: "stacked", layout, mode: "percent", categories: ["Category"],
      series: values.map((value, i) => ({ name: `S${i}`, values: [value] })),
    };
    const html = renderStacked(spec, { locale: "en" });
    check(html, []);
    const expected = values.reduce((a, b) => a + b, 0) === 0 ? 0 : 100;
    const cells = [...html.matchAll(/ig-chart__stacked-cell[^>]*style="([^"]+)"/g)];
    const dimension = layout === "bar" ? "width" : "height";
    const sum = cells.slice(0, values.length).reduce((total, cell) => {
      const match = cell[1].match(new RegExp(`${dimension}:([\\d.]+)%`));
      assert(match);
      return total + Number(match[1]);
    }, 0);
    const normalized = layout === "bar" ? sum : sum / 74 * 100;
    assert(Math.abs(normalized - expected) < 0.01, "percent geometry sum");
    const visible = html.split('<table class="ig-chart__table">')[0];
    for (const n of values) {
      const percent = expected === 0 ? 0 : n / values.reduce((a, b) => a + b, 0) * 100;
      assert(visible.includes(formatValue(percent, "en", { kind: "percent", decimals: 1 })));
    }
    assert(html.includes("ig-chart__legend"));
    count++;
  }
}
function check(html: string, values: number[]) {
  assert(!/NaN|Infinity/.test(html));
  for (const match of html.matchAll(/(?:left|top|width|height):(-?[\d.]+)%/g)) {
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  for (const match of html.matchAll(/(?:x|y|width|height)="(-?[\d.]+)"/g)) {
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  const [visible, table] = html.split('<table class="ig-chart__table">');
  for (const value of values) {
    const text = formatValue(value, "en");
    assert(visible.includes(text));
    assert(table.includes(text));
  }
}
const fixturePath = "design-system/charts/fixtures/valid";
for (const file of readdirSync(fixturePath).filter((f) => /^(column|stacked)\./.test(f))) {
  const spec = JSON.parse(readFileSync(`${fixturePath}/${file}`, "utf8")) as
    ColumnSpec | StackedSpec;
  const locale = file.endsWith("en.json") ? "en" : "es";
  const html = spec.type === "column"
    ? renderColumn(spec, { locale }) : renderStacked(spec, { locale });
  const [visible, table] = html.split('<table class="ig-chart__table">');
  const wide = visible.split('<div class="ig-chart__wide">')[1]
    .split('<div class="ig-chart__narrow">')[0];
  const narrow = visible.split('<div class="ig-chart__narrow">')[1];
  for (const band of [wide, narrow]) {
    const vertical = [...band.matchAll(/ig-chart__plot ig-chart__(column-plot|stacked-columns)/g)];
    assert(vertical.length <= 1, `${file}: repeated column plots in one band`);
    if (/^column\.(es|en)\.json$/.test(file)) assert.equal(vertical.length, 1);
    if (/column\.(many|four-series)|stacked\.columns\.highlight-free/.test(file)) {
      assert.equal(vertical.length, 0, `${file}: dense fixture must use horizontal rows`);
    }
    if (vertical.length === 0) {
      const rowClass = spec.type === "column" ? "column-group" : "stacked-heading";
      assert.equal([...band.matchAll(new RegExp(`ig-chart__${rowClass}`, "g"))].length,
        spec.categories.length, `${file}: every category needs a horizontal row`);
    }
    if (spec.type === "stacked") {
      const expected = spec.series.flatMap((series) => series.values.map((n, i) => {
        const total = spec.series.reduce((sum, s) => sum + s.values[i], 0);
        const unit = spec.mode === "percent" ? spec.unit?.kind === "percent" ? spec.unit : {
          kind: "percent" as const, decimals: 1 as const,
        } : spec.unit;
        const value = spec.mode === "percent" ? total === 0 ? 0 : n / total * 100 : n;
        return formatValue(value, locale, unit);
      }));
      const actual = [...band.matchAll(/<span class="ig-chart__value">([^<]*)<\/span>/g)]
        .map((m) => m[1]);
      assert.deepEqual(actual.sort(), expected.sort(), `${file}: each datum appears once per band`);
      if (file.includes("highlight-free")) {
        assert(!band.includes("ig-chart__stacked-detail"), "no redundant value legend");
      }
    }
    if (file.includes("column.many")) {
      const ends = [...band.matchAll(/column-end[^>]*style="left:([\d.]+)%"/g)];
      assert(new Set(ends.map((m) => m[1])).size > 1, "values must follow each bar end");
    }
  }
  if (spec.type === "stacked") {
    const legends = [...visible.matchAll(/<li class="ig-chart__legend-item[^>]*>.*?<\/li>/g)];
    assert.equal(legends.filter((m) => !m[0].includes("ig-chart__value")).length,
      spec.series.length, "general series legend appears once");
  }
  spec.series.forEach((series) => series.values.forEach((n, i) => {
    const original = formatValue(n, locale, spec.unit);
    assert(table.includes(original), `${file}: original value missing from table`);
    if (spec.type === "stacked" && spec.mode === "percent") {
      const total = spec.series.reduce((sum, s) => sum + s.values[i], 0);
      const unit = spec.unit?.kind === "percent" ? spec.unit : {
        kind: "percent" as const, decimals: 1 as const,
      };
      const normalized = formatValue(total === 0 ? 0 : n / total * 100, locale, unit);
      assert(visible.includes(normalized), `${file}: percent missing from visible text`);
      assert(table.includes(normalized));
    } else assert(visible.includes(original), `${file}: value missing from visible text`);
  }));
  assert(!/stacked-cell ig-chart__s6[^>]*><span/.test(html), "text over data-6");
  count++;
}
console.log(`charts-column-test: ${count} cases passed, 0 failures`);
