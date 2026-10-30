// Failure modes: equal points, singleton, constant x, negative axes, 1e9 and 0.003;
// coincident highlights must get distinct label positions; coordinates must stay finite in 0–100.
// Regression: labels covering South or another point; non-highlight text leaking into the body.
// Browser: X title gap <= 8px; ranking values at bar endpoints, vertically centered.
// Ranking: stable ascending/descending ties, negatives, all zero, visible and tabular values.
import assert from "node:assert/strict";
import { renderChart } from "../../design-system/charts/index.ts";
import { formatValue } from "../../design-system/charts/format.ts";
import type { ScatterSpec, RankingSpec } from "../../design-system/charts/schema/index.ts";

const base = { id: "edge", title: "Edge", sourceQuote: "Example" };
const scatter: ScatterSpec = {
  ...base, type: "scatter", x: { label: "X" }, y: { label: "Y" },
  points: [{ x: 1, y: 1 }],
};
const cases = [
  [{ x: 1, y: 1 }, { x: 1, y: 1 }], [{ x: 0, y: 0 }],
  [{ x: 2, y: 1 }, { x: 2, y: 9 }],
  [{ x: -5, y: 4 }, { x: 5, y: -4 }],
  [{ x: 1e9, y: 0.003 }, { x: 2e9, y: 0.006 }],
  [
    { x: -12, y: 8, highlight: true, label: "North" },
    { x: 8, y: -5, highlight: true, label: "South" },
    { x: 9, y: -5 }, { x: 6, y: -3 },
  ],
  Array.from({ length: 8 }, (_, i) => ({
    x: 1, y: 1, highlight: true, label: `Point ${i}`,
  })),
];
for (const points of cases) {
  const html = renderChart({ ...scatter, points }, { locale: "en" });
  assert(!/NaN|Infinity/.test(html));
  assert(!html.includes("scatter-values"));
  const visible = html.split("<table")[0];
  if (!points.some((point) => point.highlight)) assert(!visible.includes("<li>"));
  for (const point of points) {
    assert(html.includes(`<td>${formatValue(point.x, "en")}</td>`));
    assert(html.includes(`<td>${formatValue(point.y, "en")}</td>`));
  }
  const variants = html.split(/<div class="ig-chart__(?:wide|narrow)">/).slice(1);
  for (const [band, variant] of variants.entries()) {
    const width = band === 0 ? 481 : 280;
    const coordinates = (style: string) => Object.fromEntries(
      [...style.matchAll(/(left|top|width|height):([\d.]+)%/g)]
        .map((m) => [m[1], Number(m[2])]),
    );
    const cloud = [...variant.matchAll(/scatter-point [^"]+" style="([^"]+)"/g)]
      .map((m) => coordinates(m[1]));
    const tags = [...variant.matchAll(/scatter-tag" style="([^"]+)"/g)]
      .map((m) => coordinates(m[1]));
    for (const tag of tags) {
      for (const [i, point] of cloud.entries()) {
        const radius = points[i].highlight ? 9 : 3.5;
        const x = point.left * width / 100;
        const y = point.top * 3.6;
        const left = tag.left * width / 100;
        const top = tag.top * 3.6;
        assert(x + radius <= left || x - radius >= left + tag.width * width / 100
          || y + radius <= top || y - radius >= top + tag.height * 3.6);
      }
    }
  }
  for (const match of html.matchAll(/(?:left|top|width|height):(-?[\d.]+)%/g)) {
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  for (const match of html.matchAll(/(?:x1|x2|y1|y2)="(-?[\d.]+)"/g)) {
    assert(Number.isFinite(Number(match[1])));
    assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
  }
  assert.equal((html.match(/ig-chart__scatter-point /g) ?? []).length, points.length * 2);
  if (points.length === 8) {
    const positions = [...html.matchAll(/scatter-tag" style="([^"]+)"/g)];
    assert.equal(new Set(positions.slice(0, 8).map((m) => m[1])).size, 8);
  }
}
for (const order of ["asc", "desc"] as const) {
  for (const values of [[3, 1, 3, -4], [0, 0, 0]]) {
    const spec: RankingSpec = {
      ...base, type: "ranking", order,
      items: values.map((value, i) => ({ label: `Item ${i}`, value })),
    };
    const html = renderChart(spec, { locale: "en" });
    for (const match of html.matchAll(/(?:left|width):(-?[\d.]+)%/g)) {
      assert(Number(match[1]) >= 0 && Number(match[1]) <= 100);
    }
    const body = html.split('<table')[0];
    const sorted = spec.items.toSorted((a, b) =>
      order === "asc" ? a.value - b.value : b.value - a.value);
    let previous = -1;
    for (const item of sorted) {
      const position = body.indexOf(`>${item.label}</span>`);
      assert(position > previous);
      previous = position;
      const value = formatValue(item.value, "en", spec.unit);
      assert(body.includes(`>${value}</span>`));
      assert(html.includes(`<td>${value}</td>`));
    }
  }
}
console.log("charts-scatter-test: 7 scatter edge cases, 4 ranking cases passed");


if (process.argv.includes("--browser")) {
  const { spawn } = await import("node:child_process");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const probe = `(() => {
    const issues = [];
    let labels = 0, rows = 0;
    const visible = (el) => el.getClientRects().length && getComputedStyle(el).display !== 'none';
    document.querySelectorAll('.ig-chart__scatter-plot').forEach((plot) => {
      if (!visible(plot)) return;
      const points = [...plot.querySelectorAll('.ig-chart__scatter-point')].map((point) => {
        const r = point.getBoundingClientRect();
        const extra = point.classList.contains('ig-chart__scatter-point--focus') ? 5 : 0;
        return { left: r.left - extra, right: r.right + extra,
          top: r.top - extra, bottom: r.bottom + extra };
      });
      plot.querySelectorAll('.ig-chart__scatter-tag').forEach((tag) => {
        labels++;
        const r = tag.getBoundingClientRect();
        if (points.some((p) => r.left < p.right && r.right > p.left
          && r.top < p.bottom && r.bottom > p.top)) issues.push('label covers point');
      });
      const ticks = [...plot.querySelectorAll('.ig-chart__scatter-xtick')];
      const bottom = Math.max(...ticks.map((t) => t.getBoundingClientRect().bottom));
      const title = plot.nextElementSibling.getBoundingClientRect();
      const gap = title.top - bottom;
      if (gap < 0 || gap > 8) issues.push('X title gap: ' + gap);
    });
    document.querySelectorAll('.ig-chart__ranking-row').forEach((row) => {
      rows++;
      const bar = row.querySelector('.ig-chart__ranking-bar').getBoundingClientRect();
      const value = row.querySelector('.ig-chart__ranking-value');
      const r = value.getBoundingClientRect();
      const negative = value.classList.contains('ig-chart__ranking-value--negative');
      const gap = negative ? bar.left - r.right : r.left - bar.right;
      if (Math.abs(gap - 8) > 1) issues.push('ranking endpoint gap: ' + gap);
      if (Math.abs((r.top + r.bottom - bar.top - bar.bottom) / 2) > 1)
        issues.push('ranking value not centered');
    });
    return { labels, rows, issues };
  })()`;
  const runs = [];
  for (const type of ["scatter", "ranking"]) {
    for (const width of [360, 1280]) {
      for (const theme of ["light", "dark"]) {
        const profile = fs.mkdtempSync(path.join(os.tmpdir(), "scatter-review-"));
        const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
          "--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0",
          `--user-data-dir=${profile}`, "about:blank",
        ], { stdio: "ignore" });
        let socket: WebSocket | undefined;
        try {
          const portFile = path.join(profile, "DevToolsActivePort");
          for (let i = 0; i < 80 && !fs.existsSync(portFile); i++) await pause(100);
          const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
          const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
          const ws = new WebSocket(pages.find((p: { type: string }) =>
            p.type === "page").webSocketDebuggerUrl);
          socket = ws;
          await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
          let id = 0;
          type Reply = {
            result: {
              exceptionDetails?: unknown;
              result: { value: { labels: number; rows: number; issues: string[] } };
            };
          };
          const pending = new Map<number, (value: Reply) => void>();
          ws.onmessage = (event) => {
            const message = JSON.parse(String(event.data));
            pending.get(message.id)?.(message);
            pending.delete(message.id);
          };
          const send = (method: string, params = {}): Promise<Reply> => new Promise((resolve) => {
            const next = ++id;
            pending.set(next, resolve);
            ws.send(JSON.stringify({ id: next, method, params }));
          });
          await send("Emulation.setDeviceMetricsOverride", {
            width, height: 900, deviceScaleFactor: 1, mobile: width < 600,
          });
          await send("Emulation.setEmulatedMedia", {
            features: [{ name: "prefers-color-scheme", value: theme }],
          });
          await send("Page.navigate", { url: pathToFileURL(path.resolve(
            `design-system/reports/charts/${type}.html`)).href });
          await pause(700);
          await send("Runtime.evaluate", {
            expression: "document.fonts.ready", awaitPromise: true,
          });
          const result = await send("Runtime.evaluate", {
            expression: probe, returnByValue: true,
          });
          assert(!result.result.exceptionDetails);
          const measured = result.result.result.value;
          assert(type === "scatter" ? measured.labels > 0 : measured.rows > 0);
          runs.push({ type, width, theme, ...measured });
          console.log(`${type} ${width}px ${theme}: ${measured.issues.length} review issue(s)`);
        } finally {
          socket?.close();
          chrome.kill();
          await pause(300);
          fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        }
      }
    }
  }
  fs.writeFileSync("design-system/reports/charts/scatter.review.layout.json",
    JSON.stringify({ runs }, null, 2) + "\n");
  assert(runs.every((run) => run.issues.length === 0));
}
