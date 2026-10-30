// Failure modes, declared before implementation:
// 50/50 and 99.6/0.4 splits; invisible tiny arcs; nonfinite angles or wrong angular sum;
// reordered sectors; absent total; missing visible/table values and percentages;
// pictogram zero/full/decimal counts, partial clipping, and incorrect grid capacity.
import assert from "node:assert/strict";
import { renderDonut } from "../../design-system/charts/render/donut.ts";
import { renderPictogram } from "../../design-system/charts/render/pictogram.ts";
import { formatValue } from "../../design-system/charts/format.ts";
import type { DonutSpec, PictogramSpec } from "../../design-system/charts/schema/index.ts";

const base = { id: "test", title: "Test", sourceQuote: "Example" };
let checks = 0;
for (const values of [[50, 50], [99.6, 0.4], [1e15, 1e15], [1, 2, 3, 4, 5, 6]]) {
  const spec: DonutSpec = {
    ...base, type: "donut", unit: { kind: "number", decimals: 1 },
    parts: values.map((value, i) => ({ label: `Part ${i}`, value })),
  };
  const html = renderDonut(spec, { locale: "en" });
  const angles = [...html.matchAll(/data-angle="([^"]+)"/g)].map((m) => Number(m[1]));
  assert.equal(angles.length, values.length);
  assert(angles.every((angle) => Number.isFinite(angle) && angle >= 3));
  assert(Math.abs(angles.reduce((a, b) => a + b, 0) - 360) < 0.01);
  assert(!html.includes("NaN") && !html.includes("Infinity"));
  assert(!html.includes("Total"));
  assert(html.includes('d="M 50 4 A'));
  assert(html.includes('viewBox="0 0 100 100"'));
  assert(!html.includes('preserveAspectRatio="none"'));
  for (const path of html.matchAll(/ d="([^"]+)"/g)) {
    const numbers = path[1].match(/-?\d+(?:\.\d+)?/g) ?? [];
    assert(numbers.every((value) => Number(value) >= 0 && Number(value) <= 100));
  }
  const withTotal = renderDonut({ ...spec, total: { label: "Total", value: 100 } }, {
    locale: "en",
  });
  assert(withTotal.includes('ig-chart__donut-total-label">Total</span>'));
  assert(withTotal.slice(withTotal.indexOf("<table")).includes("Total"));
  const max = Math.max(...values);
  const sum = values.reduce((a, value) => a + value / max, 0);
  for (const [i, value] of values.entries()) {
    assert(html.indexOf(`data-part="${i}"`) < html.indexOf(`Part ${i}`));
    for (const text of [formatValue(value, "en", spec.unit),
      formatValue(value / max / sum * 100, "en", { kind: "percent", decimals: 1 })]) {
      assert(html.includes(text), text);
      assert(html.slice(html.indexOf("<table")).includes(text), text);
    }
  }
  checks++;
}
const highlighted = renderDonut({
  ...base, type: "donut", parts: [
    { label: "Large", value: 99.6 },
    { label: "Tiny", value: 0.4, emphasis: "highlight" },
  ],
}, { locale: "en" });
assert(highlighted.includes('data-part="1" data-angle="10"'));
checks++;
for (const ofValue of [10, 100] as const) {
  for (const value of [0, ofValue, ...(ofValue === 10 ? [7.5] : [37])]) {
    const spec: PictogramSpec = {
      ...base, type: "pictogram", of: ofValue, value, label: "People", icon: "person",
    };
    const html = renderPictogram(spec, { locale: "en" });
    assert.equal([...html.matchAll(/data-icon="/g)].length, ofValue);
    assert.equal([...html.matchAll(/data-fill="100"/g)].length, Math.floor(value));
    assert.equal([...html.matchAll(/data-fill="50"/g)].length, value % 1 ? 1 : 0);
    if (value % 1) assert(html.includes('style="width:50%"'));
    const count = formatValue(value, "en", {
      kind: "number", decimals: value % 1 ? 1 : 0,
    });
    const percentage = formatValue(value / ofValue * 100, "en", {
      kind: "percent", decimals: ofValue === 10 && value % 1 ? 1 : 0,
    });
    const visible = html.slice(0, html.indexOf("<table"));
    const table = html.slice(html.indexOf("<table"));
    assert(visible.includes(`${count} of ${formatValue(ofValue, "en")}`));
    assert(visible.includes(percentage) && table.includes(percentage));
    assert(table.includes(`<td>${count}</td>`));
    assert(html.includes("People"));
    assert(html.slice(html.indexOf("<table")).includes("People"));
    checks++;
  }
}
console.log(`charts-donut-test: ${checks} cases passed, 0 failures`);
