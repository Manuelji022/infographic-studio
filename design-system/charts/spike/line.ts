export type LineSeries = { name: string; values: number[] };
type Locale = "es" | "en";

const YEARS = Array.from({ length: 11 }, (_, index) => 2000 + index * 5);
const PROJECTION_INDEX = 5;

function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Round the domain to a step from 1, 2, 2.5, 5 times a power of ten. */
function niceScale(values: number[]): { ticks: number[]; min: number; max: number } {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const roughStep = (max - min || 1) / 5;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const factor = [1, 2, 2.5, 5, 10].find((value) => value * power >= roughStep)!;
  const step = factor * power;
  const lower = Math.floor(min / step) * step;
  const upper = Math.ceil((max || step) / step) * step;
  const count = Math.round((upper - lower) / step);
  const ticks = Array.from({ length: count + 1 }, (_, index) => lower + index * step);
  return { ticks, min: lower, max: upper };
}

/** Conservative sans-serif width estimate at the DS label's 12px size (+10%). */
function labelWidth(text: string): number {
  const ems = Array.from(text).reduce((sum, char) => {
    if (/[ ilI.,:%]/.test(char)) return sum + 0.35;
    if (/[MWmw]/.test(char)) return sum + 0.9;
    return sum + 0.62;
  }, 0);
  return Math.ceil(ems * 12 * 1.1);
}

function separateLabels(positions: number[]): number[] {
  // 12 percentage points = 36px even in the compact, 300px-high plot.
  const sorted = positions.map((top, index) => ({ top, index })).sort((a, b) => a.top - b.top);
  for (let index = 1; index < sorted.length; index += 1) {
    sorted[index].top = Math.max(sorted[index].top, sorted[index - 1].top + 12);
  }
  const overflow = Math.max(0, sorted.at(-1)!.top - 94);
  return positions.map((_, index) => sorted.find((label) => label.index === index)!.top - overflow);
}

export function renderLineSpike(data: LineSeries[], locale: Locale): string {
  if (locale !== "es" && locale !== "en") throw new Error("Unsupported line locale");
  if (
    data.length !== 2 ||
    data.some((series) =>
      series.values.length !== YEARS.length ||
      series.values.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new Error("Line spike requires two series of eleven finite values");
  }
  const title = locale === "es"
    ? "El gasto en pensiones casi se duplicará"
    : "Pension spending will nearly double";
  const description = locale === "es"
    ? "Gasto en pensiones, % del PIB"
    : "Pension spending, % of GDP";
  const note = locale === "es" ? "Proyección desde 2025" : "Projection from 2025";
  const formatter = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const format = (value: number) => formatter.format(value / 100);
  const axisFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 });
  const scale = niceScale(data.flatMap((series) => series.values));
  const x = (index: number) => index / (YEARS.length - 1) * 100;
  const y = (value: number) => 100 - (value - scale.min) / (scale.max - scale.min) * 100;
  const position = (left: number, top: number) => `left:${left}%;top:${top}%`;
  const endText = data.map((series) => `${series.name} ${format(series.values.at(-1)!)}`);
  const reserve = Math.max(...endText.map(labelWidth)) + 14;
  const endPositions = separateLabels(data.map((series) => y(series.values.at(-1)!)));

  const grid = scale.ticks.map((tick) => [
    `<line class="line-grid" x1="0" x2="100" y1="${y(tick)}" y2="${y(tick)}"/>`,
  ].join("")).join("");
  const geometry = data.map((series, index) => {
    const points = (start: number, end: number) => series.values
      .slice(start, end)
      .map((value, offset) => `${x(start + offset)},${y(value)}`)
      .join(" ");
    const marks = [0, YEARS.length - 1].map((point) => [
      `<line class="line-mark" x1="${x(point)}" x2="${x(point)}"`,
      ` y1="${y(series.values[point]) - 0.15}"`,
      ` y2="${y(series.values[point]) + 0.15}"/>`,
    ].join("")).join("");
    return [
      `<g class="line-series line-series--${index}">`,
      `<polyline points="${points(0, PROJECTION_INDEX + 1)}"/>`,
      `<polyline class="line-projected"`,
      ` points="${points(PROJECTION_INDEX, YEARS.length)}"/>`,
      marks,
      "</g>",
    ].join("");
  }).join("");
  const yLabels = scale.ticks.map((tick) => [
    `<span class="line-y" style="${position(0, y(tick))}">`,
    escape(axisFormat.format(tick)),
    "</span>",
  ].join("")).join("");
  const xLabel = (index: number, variant: string) => [
    `<span class="line-x ${variant}" style="${position(x(index), 100)}">`,
    escape(String(YEARS[index])),
    "</span>",
  ].join("");
  const xLabels = YEARS.map((_, index) => xLabel(index, "line--wide-only")).join("") +
    YEARS.map((_, index) => index % 2 === 0 ? xLabel(index, "line--narrow-only") : "")
      .join("");
  const labels = data.map((series, index) => [
    `<span class="line-first" style="${position(0, y(series.values[0]))}">`,
    escape(format(series.values[0])),
    "</span>",
    `<span class="line-end" style="${position(100, endPositions[index])}">`,
    escape(endText[index]),
    "</span>",
  ].join("")).join("");
  const rows = YEARS.map((year, index) => [
    `<tr><th scope="row">${escape(String(year))}</th>`,
    ...data.map((series) => `<td>${escape(format(series.values[index]))}</td>`),
    "</tr>",
  ].join("")).join("");
  return [
    '<figure class="line-chart" role="img" aria-labelledby="line-title line-desc">',
    `<h2 id="line-title">${escape(title)}</h2>`,
    `<p id="line-desc">${escape(description)}</p>`,
    `<div class="line-frame" style="--line-end-space:${reserve}px">`,
    '<div class="line-plot">',
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">',
    grid,
    geometry,
    "</svg>",
    yLabels,
    xLabels,
    labels,
    "</div></div>",
    `<p class="line-note">${escape(note)}</p>`,
    "</figure>",
    '<table class="line-hidden">',
    `<caption>${escape(description)}</caption><thead><tr>`,
    `<th scope="col">${locale === "es" ? "Año" : "Year"}</th>`,
    ...data.map((series) => `<th scope="col">${escape(series.name)}</th>`),
    `</tr></thead><tbody>${rows}</tbody></table>`,
  ].join("");
}
