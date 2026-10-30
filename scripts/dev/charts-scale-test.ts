import assert from "node:assert/strict";
import { linearScale, niceDomain } from "../../design-system/charts/layout/scale.ts";
import { formatTick, formatValue } from "../../design-system/charts/format.ts";
import type { UnitFormat } from "../../design-system/charts/format.ts";

let passed = 0;
let failed = 0;
function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log(`OK ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Failure inventory: degenerate/invalid domains, sign coverage, tick noise, locale and precision.
test("linear endpoints, interpolation, extrapolation and reversed range", () => {
  const scale = linearScale([0, 10], [100, 0]);
  assert.deepEqual([scale(0), scale(5), scale(10), scale(20)], [100, 50, 0, -100]);
  assert.equal(linearScale([10, 0], [0, 100])(5), 50);
});
test("zero-width domains always return the range midpoint", () => {
  for (const value of [0, 5, -5]) {
    const scale = linearScale([value, value], [20, 80]);
    assert.equal(scale(value), 50);
    assert.equal(scale(999), 50);
  }
});

const fixtures: [string, number[], boolean][] = [
  ["equal positive", [7, 7, 7], false],
  ["equal negative", [-7, -7], false],
  ["single value", [42], false],
  ["single negative", [-42], true],
  ["all zero", [0, 0, 0], false],
  ["zero with baseline", [0], true],
  ["mixed signs", [-3, 7], false],
  ["large values", [1e9, 2e9, 3e9], true],
  ["small values", [0.003, 0.007], false],
  ["fractional values", [0.1, 0.3, 0.7], true],
  ["positive baseline", [12, 19], true],
  ["negative baseline", [-19, -12], true],
];
for (const [name, values, includeZero] of fixtures) {
  test(`domain ${name}`, () => {
    const result = niceDomain(values, { includeZero, maxTicks: 6 });
    assert.ok(result.min <= Math.min(...values));
    assert.ok(result.max >= Math.max(...values));
    assert.ok(result.max > result.min);
    assert.ok(result.ticks.length >= 2 && result.ticks.length <= 6);
    assert.equal(result.ticks[0], result.min);
    assert.equal(result.ticks.at(-1), result.max);
    const factor = result.step / 10 ** Math.floor(Math.log10(result.step));
    assert.ok([1, 2, 2.5, 5].some((value) => Math.abs(value - factor) < 1e-12));
    result.ticks.forEach((tick, index) => {
      assert.ok(Number.isFinite(tick));
      assert.equal(Object.is(tick, -0), false);
      if (index > 0) assert.ok(tick > result.ticks[index - 1]);
    });
    if (includeZero || (Math.min(...values) < 0 && Math.max(...values) > 0)) {
      assert.ok(result.ticks.includes(0));
    }
    assert.deepEqual(niceDomain(values, { includeZero, maxTicks: 6 }), result);
  });
}
test("decimal ticks contain no accumulated floating-point noise", () => {
  const domain = niceDomain([0, 0.5], { includeZero: true, maxTicks: 6 });
  assert.deepEqual(domain.ticks, [0, 0.1, 0.2, 0.3, 0.4, 0.5]);
});
test("2.5 is available as a nice step", () => {
  assert.equal(niceDomain([0, 10], { includeZero: true, maxTicks: 5 }).step, 2.5);
});
test("mixed signs prioritize zero over a two-tick budget", () => {
  const domain = niceDomain([-3, 7], { includeZero: false, maxTicks: 2 });
  assert.equal(domain.ticks.length, 3);
  assert.ok(domain.ticks.includes(0));
  assert.ok(domain.min <= -3 && domain.max >= 7);
});
for (const values of [[], [NaN], [Infinity], [-Infinity], [1, NaN]]) {
  test(`invalid values ${String(values)}`, () => {
    assert.throws(() => niceDomain(values, { includeZero: false, maxTicks: 6 }), Error);
  });
}
for (const maxTicks of [0, 1, 2.5, NaN, Infinity]) {
  test(`invalid tick budget ${maxTicks}`, () => {
    assert.throws(() => niceDomain([1, 2], { includeZero: false, maxTicks }), Error);
  });
}

const formats: [string, number, "es" | "en", UnitFormat | undefined, string][] = [
  ["ES decimal", 25.6, "es", undefined, "25,6"],
  ["EN decimal", 25.6, "en", undefined, "25.6"],
  ["ES four digits", 1500, "es", undefined, "1500"],
  ["ES grouping", 15000, "es", undefined, "15.000"],
  ["EN grouping", 1500, "en", undefined, "1,500"],
  ["ES percent", 25.6, "es", { kind: "percent" }, "25,6\u00a0%"],
  ["EN percent", 25.6, "en", { kind: "percent" }, "25.6%"],
  ["ES EUR", 25.6, "es", { kind: "currency", currency: "EUR" }, "25,6\u00a0€"],
  ["EN USD", 25.6, "en", { kind: "currency", currency: "USD" }, "$25.6"],
  ["EN EUR", 25, "en", { kind: "currency", currency: "EUR" }, "€25"],
  ["ES USD", 25, "es", { kind: "currency", currency: "USD" }, "25\u00a0US$"],
  ["zero decimals", 25.6, "es", { kind: "number", decimals: 0 }, "26"],
  ["one decimal", 25, "en", { kind: "number", decimals: 1 }, "25.0"],
  ["two decimals", 25.6, "es", { kind: "number", decimals: 2 }, "25,60"],
  ["default rounding", 25.64, "en", undefined, "25.6"],
  ["ES suffix", 25, "es", { kind: "number", suffix: "km" }, "25\u202fkm"],
  ["EN suffix", 25, "en", { kind: "number", suffix: "km" }, "25 km"],
];
for (const [name, value, locale, unit, expected] of formats) {
  test(`format ${name}`, () => assert.equal(formatValue(value, locale, unit), expected));
}
test("ticks trim trailing decimal zeroes in both locales", () => {
  for (const locale of ["es", "en"] as const) {
    const unit: UnitFormat = { kind: "number", decimals: 2 };
    assert.equal(formatTick(10, locale, unit), "10");
    assert.equal(formatTick(2.5, locale, unit), locale === "es" ? "2,5" : "2.5");
    assert.equal(formatTick(2.55, locale, unit), locale === "es" ? "2,55" : "2.55");
  }
  assert.equal(formatTick(10, "es", { kind: "percent", decimals: 2 }), "10\u00a0%");
  assert.equal(formatTick(10, "en", { kind: "currency", decimals: 2 }), "€10");
});

console.log(`Total: ${passed + failed}; OK: ${passed}; FAIL: ${failed}`);
if (failed > 0) process.exitCode = 1;
