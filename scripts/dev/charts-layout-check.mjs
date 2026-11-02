// Usage: node scripts/dev/charts-layout-check.mjs <type> [type ...]
// Opens design-system/reports/charts/<type>.html in headless Chrome at 360 and 1280 px, light and
// dark, and measures the real DOM (independent of measure.ts): horizontal overflow, text boxes that
// overlap each other, text outside its chart, and clipped text. Writes
// design-system/reports/charts/<type>.layout.json and exits 1 on any issue.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const types = process.argv.slice(2);
if (types.length === 0) {
  console.error('usage: charts-layout-check.mjs <type> [type ...]');
  process.exit(2);
}
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs in the page. Text boxes come from Range rects over text nodes, so they are the glyph
// boxes the browser actually laid out, not element boxes.
const probe = `(() => {
  const issues = [];
  const tol = 1;
  if (document.documentElement.scrollWidth > innerWidth) {
    issues.push({ kind: 'page-overflow', detail: document.documentElement.scrollWidth });
  }
  const visible = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      const hidden = s.display === 'none' || s.visibility === 'hidden';
      if (hidden || Number(s.opacity) === 0) return false;
    }
    return true;
  };
  document.querySelectorAll('figure.ig-chart').forEach((figure, index) => {
    const name = figure.closest('section')?.querySelector('h2')?.textContent ?? 'chart ' + index;
    const frame = figure.getBoundingClientRect();
    if (figure.scrollWidth > figure.clientWidth + tol) {
      issues.push({ chart: name, kind: 'chart-overflow', detail: figure.scrollWidth });
    }
    const body = figure.querySelector('.ig-chart__body');
    if (!body) { issues.push({ chart: name, kind: 'no-body' }); return; }
    const boxes = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (!text || !visible(node.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width < 0.5 || r.height < 0.5) continue;
        boxes.push({ text, el: node.parentElement, r });
      }
      const el = node.parentElement;
      const s = getComputedStyle(el);
      if (s.overflow !== 'visible' && (el.scrollWidth > el.clientWidth + tol)) {
        issues.push({ chart: name, kind: 'clipped', text });
      }
      if (s.textOverflow === 'ellipsis') issues.push({ chart: name, kind: 'ellipsis', text });
    }
    for (const b of boxes) {
      if (b.r.left < frame.left - tol || b.r.right > frame.right + tol) {
        issues.push({ chart: name, kind: 'outside-chart', text: b.text,
          detail: [Math.round(b.r.left - frame.left), Math.round(frame.right - b.r.right)] });
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (w > tol && h > tol) {
          issues.push({ chart: name, kind: 'overlap', text: a.text + ' | ' + b.text,
            detail: [Math.round(w), Math.round(h)] });
        }
      }
    }
  });
  return { charts: document.querySelectorAll('figure.ig-chart').length, issues };
})()`;

async function check(file, width, scheme) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chartcheck-'));
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let wsUrl;
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try {
        const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        wsUrl = tabs.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
      } catch { /* not ready */ }
      if (!wsUrl) await sleep(250);
    }
    if (!wsUrl) throw new Error('Chrome did not start');
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    const pending = new Map();
    const events = [];
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      else events.push(msg.method);
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params }));
    });
    await send('Page.enable');
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: 900, deviceScaleFactor: 1, mobile: width < 600,
    });
    await send('Page.navigate', { url: pathToFileURL(file).href });
    for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(250);
    await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
    await sleep(300);
    const result = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
    ws.close();
    const exception = result.result.exceptionDetails;
    if (exception) throw new Error(JSON.stringify(exception));
    return result.result.result.value;
  } finally {
    proc.kill();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
    catch { /* temp profile */ }
  }
}

let total = 0;
for (const type of types) {
  const file = path.resolve(`design-system/reports/charts/${type}.html`);
  if (!fs.existsSync(file)) throw new Error(`Missing report: ${file} (run charts-report.ts first)`);
  const runs = [];
  for (const width of [360, 1280]) {
    for (const scheme of ['light', 'dark']) {
      const { charts, issues } = await check(file, width, scheme);
      runs.push({ width, scheme, charts, issues });
      total += issues.length;
      console.log(`${type} ${width}px ${scheme}: ${charts} charts, ${issues.length} issue(s)`);
      for (const issue of issues) console.log(`  ${JSON.stringify(issue)}`);
    }
  }
  const report = path.resolve(`design-system/reports/charts/${type}.layout.json`);
  fs.writeFileSync(report, `${JSON.stringify({ type, runs }, null, 2)}\n`);
}
if (total > 0) process.exit(1);
