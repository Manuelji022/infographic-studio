export function linearScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [min, max] = domain;
  const [start, end] = range;
  if (min === max) return () => start / 2 + end / 2;
  return (value) => {
    const span = max - min;
    const ratio = Number.isFinite(span)
      ? (value - min) / span
      : (value / 2 - min / 2) / (max / 2 - min / 2);
    return start * (1 - ratio) + end * ratio;
  };
}

const FACTORS = [1, 2, 2.5, 5, 10];

function niceStep(target: number): number {
  const power = 10 ** Math.floor(Math.log10(target));
  const factor = FACTORS.find((value) => value * power >= target) ?? 10;
  return Number((factor * power).toPrecision(15));
}

function tickValue(index: number, step: number): number {
  // Round the product, rather than accumulating a floating-point step.
  const value = Number((index * step).toPrecision(15));
  return Object.is(value, -0) ? 0 : value;
}

export function niceDomain(
  values: number[],
  options: { includeZero: boolean; maxTicks: number },
): { min: number; max: number; step: number; ticks: number[] } {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Scale values must be a nonempty list of finite numbers");
  }
  const { includeZero, maxTicks } = options;
  if (!Number.isInteger(maxTicks) || maxTicks < 2) {
    throw new Error("maxTicks must be an integer of at least 2");
  }
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === 0 && max === 0) max = 1;
  if (min === max) {
    const padding = Math.abs(min) / 10 || 1;
    min -= padding;
    max += padding;
  }
  // Covering both signs and zero takes priority over a two-tick budget.
  const limit = min < 0 && max > 0 ? Math.max(3, maxTicks) : maxTicks;
  let step = niceStep((max - min) / (limit - 1));
  while (Number.isFinite(step) && step > 0) {
    let first = Math.floor(min / step);
    let last = Math.ceil(max / step);
    if (tickValue(first, step) > min) first -= 1;
    if (tickValue(last, step) < max) last += 1;
    if (last - first + 1 <= limit) {
      const ticks = Array.from({ length: last - first + 1 }, (_, index) =>
        tickValue(first + index, step),
      );
      return { min: ticks[0], max: ticks[ticks.length - 1], step, ticks };
    }
    step = niceStep(step * 1.01);
  }
  throw new Error("Scale domain exceeds representable numeric precision");
}
