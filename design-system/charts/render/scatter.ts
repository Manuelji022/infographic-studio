import type { ScatterSpec } from "../schema/index.ts";
import { formatTick, formatValue, type UnitFormat } from "../format.ts";
import { linearScale, niceDomain } from "../layout/scale.ts";
import { textWidth } from "../layout/measure.ts";
import {
  escapeHtml, LABEL_FONT, MIN_WIDTH, num, placeStyle, renderFrame, TICK_FONT,
  type RenderOptions,
} from "./shared.ts";

function axisUnit(unit: string | undefined, fallback: UnitFormat | undefined) {
  return unit === undefined ? fallback : {
    kind: "number" as const, decimals: fallback?.decimals, suffix: unit,
  };
}

export function renderScatter(spec: ScatterSpec, options: RenderOptions): string {
  const { locale } = options;
  const xu = axisUnit(spec.x.unit, spec.unit);
  const yu = axisUnit(spec.y.unit, spec.unit);
  const domain = (values: number[]) => niceDomain(values, {
    includeZero: Math.min(...values) < 0 && Math.max(...values) > 0, maxTicks: 5,
  });
  const xd = domain(spec.points.map((p) => p.x));
  const yd = domain(spec.points.map((p) => p.y));
  const xs = linearScale([xd.min, xd.max], [18, 94]);
  const ys = linearScale([yd.min, yd.max], [80, 10]);
  const highlights = spec.points.filter((p) => p.highlight);
  const variant = (band: "wide" | "narrow") => {
    const width = MIN_WIDTH[band];
    const maxTick = Math.max(...xd.ticks.map((v) =>
      textWidth(formatTick(v, locale, xu), TICK_FONT)));
    const capacity = Math.max(2, Math.floor(width * 0.76 / (maxTick + 12)));
    const stride = Math.max(1, Math.ceil((xd.ticks.length - 1) / (capacity - 1)));
    const ticks = xd.ticks.filter((_, i) => i % stride === 0);
    const cloud = spec.points.map((p) => ({
      x: xs(p.x), y: ys(p.y), rx: (p.highlight ? 10 : 4) / width * 100,
      ry: (p.highlight ? 10 : 4) / 360 * 100,
    }));
    type Box = { left: number; top: number; width: number; height: number };
    const intersects = (a: Box, b: Box) => a.left < b.left + b.width
      && a.left + a.width > b.left && a.top < b.top + b.height
      && a.top + a.height > b.top;
    const occupied = cloud.map((p) => ({
      left: p.x - p.rx, top: p.y - p.ry, width: p.rx * 2, height: p.ry * 2,
    }));
    const arrange = (numbered: boolean) => {
      const placed: Box[] = [];
      const tags = [];
      for (const [i, p] of highlights.entries()) {
        const text = numbered ? formatValue(i + 1, locale)
          : p.label ?? formatValue(i + 1, locale);
        const w = (textWidth(text, LABEL_FONT) + 10) / width * 100;
        const h = 20 / 360 * 100;
        if (w > 74) return undefined;
        const x = xs(p.x);
        const y = ys(p.y);
        const dx = 16 / width * 100;
        const dy = 16 / 360 * 100;
        const candidates = [
          { left: x + dx, top: y - h / 2 },
          { left: x - dx - w, top: y - h / 2 },
          { left: x - w / 2, top: y - dy - h },
          { left: x - w / 2, top: y + dy },
        ];
        const alternatives = [];
        for (let top = 3; top <= 78; top += 3) {
          for (let left = 18; left + w <= 99; left += 3) {
            alternatives.push({ left, top });
          }
        }
        alternatives.sort((a, b) =>
          Math.hypot((a.left + w / 2 - x) * width / 100, (a.top + h / 2 - y) * 3.6)
          - Math.hypot((b.left + w / 2 - x) * width / 100, (b.top + h / 2 - y) * 3.6));
        if (numbered) candidates.push(...alternatives);
        const box = candidates.map((c) => ({ ...c, width: w, height: h })).find((c) =>
          c.left >= 18 && c.left + w <= 99 && c.top >= 3 && c.top + h <= 81
          && !occupied.some((point) => intersects(c, point))
          && !placed.some((tag) => intersects(c, {
            left: tag.left - 1, top: tag.top - 1,
            width: tag.width + 2, height: tag.height + 2,
          })));
        if (!box) return undefined;
        placed.push(box);
        tags.push({ p, text, ...box });
      }
      return tags;
    };
    const direct = arrange(false);
    const numbered = direct === undefined;
    const labelGeometry = direct ?? arrange(true) ?? [];
    const grid = [
      ...xd.ticks.map((v) => `<line x1="${num(xs(v))}" x2="${num(xs(v))}"`
        + ' y1="10" y2="80"/>'),
      ...yd.ticks.map((v) => `<line y1="${num(ys(v))}" y2="${num(ys(v))}"`
        + ' x1="18" x2="94"/>'),
    ].join("");
    const leaders = labelGeometry.map((t) =>
      `<line x1="${num(xs(t.p.x))}" y1="${num(ys(t.p.y))}"`
      + ` x2="${num(t.left)}" y2="${num(t.top + t.height / 2)}"/>`).join("");
    const points = spec.points.map((p) => {
      const extra = p.highlight ? " ig-chart__scatter-point--focus" : "";
      return `<span class="ig-chart__scatter-point ig-chart__s1${extra}"`
        + ` style="${placeStyle({ left: xs(p.x), top: ys(p.y) })}"></span>`;
    }).join("");
    const labels = labelGeometry.map((t) =>
      '<span class="ig-chart__label ig-chart__scatter-tag"'
      + ` style="${placeStyle({ left: t.left, top: t.top, width: t.width, height: t.height })}">`
      + `<span class="ig-chart__scatter-tag-text">${escapeHtml(t.text)}</span></span>`).join("");
    const tickX = (v: number) => {
      const half = textWidth(formatTick(v, locale, xu), TICK_FONT) / width * 50;
      return Math.max(half + 1, Math.min(xs(v), 99 - half));
    };
    const xt = ticks.map((v) => '<span class="ig-chart__tick ig-chart__scatter-xtick"'
      + ` style="${placeStyle({ left: tickX(v), top: 84 })}">`
      + `${escapeHtml(formatTick(v, locale, xu))}</span>`).join("");
    const yt = yd.ticks.map((v) => '<span class="ig-chart__tick ig-chart__scatter-ytick"'
      + ` style="${placeStyle({ left: 0, top: ys(v), width: 15 })}">`
      + `${escapeHtml(formatTick(v, locale, yu))}</span>`).join("");
    const list = numbered ? '<ol class="ig-chart__scatter-key">'
      + highlights.map((p) => {
        const value = `${formatValue(p.x, locale, xu)} / ${formatValue(p.y, locale, yu)}`;
        return `<li>${escapeHtml(`${p.label ?? "—"}: ${value}`)}</li>`;
      }).join("") + '</ol>' : "";
    return `<div class="ig-chart__${band}"><div class="ig-chart__scatter-ytitle">`
      + `${escapeHtml(spec.y.label)}</div><div class="ig-chart__plot ig-chart__scatter-plot">`
      + '<svg class="ig-chart__svg" viewBox="0 0 100 100"'
      + ` preserveAspectRatio="none" aria-hidden="true"><g class="ig-chart__grid">${grid}`
      + `</g><g class="ig-chart__scatter-leaders">${leaders}</g></svg>`
      + `${points}${labels}${xt}${yt}</div><div class="ig-chart__scatter-xtitle">`
      + `${escapeHtml(spec.x.label)}</div>${list}</div>`;
  };
  return renderFrame(spec, {
    instance: options.instance,
    body: variant("wide") + variant("narrow"),
    table: {
      head: ["", spec.x.label, spec.y.label],
      rows: spec.points.map((p, i) => [p.label ?? String(i + 1),
        formatValue(p.x, locale, xu), formatValue(p.y, locale, yu)]),
    },
  });
}
