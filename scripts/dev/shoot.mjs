// Usage: node shoot.mjs <url> <out.png> <width> <light|dark> [--cookie] [--wait=ms] [--selector=#id]
// Headless Chrome over CDP. --cookie sets a fake Better Auth session cookie (the proxy only
// checks that the cookie exists), so private routes can be captured.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url, out, widthArg, scheme = 'light', ...flags] = process.argv.slice(2);
const width = Number(widthArg);
const useCookie = flags.includes('--cookie');
const extraWait = Number((flags.find((f) => f.startsWith('--wait=')) ?? '--wait=900').slice(7));
const selector = (flags.find((f) => f.startsWith('--selector=')) ?? '').slice(11);
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shoot-'));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    await sleep(250);
  }
  throw new Error('shoot: Chrome did not start');
}

try {
  const ws = new WebSocket(await waitForChrome());
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
  await send('Network.enable');
  if (useCookie) {
    await send('Network.setCookie', { name: 'better-auth.session_token', value: 'x.y', url });
  }
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: scheme }],
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width, height: 900, deviceScaleFactor: 1, mobile: width < 600,
  });
  await send('Page.navigate', { url });
  for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(250);
  await sleep(extraWait);
  const h = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight' });
  const height = Math.min(Number(h.result.result.value) || 900, 12000);
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
  const over = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth' });
  if (Number(over.result.result.value) > width) {
    console.log(`shoot: WARNING horizontal overflow, scrollWidth=${over.result.result.value} > ${width}`);
  }
  const capture = { format: 'png' };
  if (selector) {
    const r = await send('Runtime.evaluate', {
      expression: `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: 0, y: b.top + scrollY, width: innerWidth, height: b.height, scale: 1 }; })()`,
      returnByValue: true,
    });
    if (!r.result.result.value) throw new Error(`selector not found: ${selector}`);
    const clip = r.result.result.value;
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: Math.ceil(clip.y + clip.height) + 10, deviceScaleFactor: 1, mobile: width < 600,
    });
    capture.clip = clip;
  }
  const shot = await send('Page.captureScreenshot', capture);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  const finalUrl = await send('Runtime.evaluate', { expression: 'location.href' });
  console.log(`shoot: wrote ${out} (${width}x${height}, ${scheme}) final url: ${finalUrl.result.result.value}`);
  ws.close();
} catch (error) {
  console.error(`shoot: ${error.message}`);
  process.exitCode = 1;
} finally {
  proc.kill();
  await sleep(400);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch { /* temp profile; the OS cleans it up */ }
}
