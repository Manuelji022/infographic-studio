// CDP behaviour test for the catalog Dialog demo. Usage: node dialogtest.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const url = 'http://localhost:3000/components';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9800 + Math.floor(Math.random() * 100);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dlg-'));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageSocket() {
  for (let i = 0; i < 60; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = tabs.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

const results = [];
function check(name, ok, detail = '') {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

try {
  const ws = new WebSocket(await pageSocket());
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
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception));
    return r.result.result.value;
  };
  const key = async (name, code, vk, extra = {}) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: vk, ...extra });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: vk, ...extra });
    await sleep(250);
  };
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(250);
  };
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCookie', { name: 'better-auth.session_token', value: 'x.y', url });
  await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(250);
  await sleep(1500);

  await evaluate(`(() => {
    window.__closeCalls = 0;
    const original = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function (...args) { window.__closeCalls++; return original.apply(this, args); };
  })()`);

  const openDemo = async () => {
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find((el) => /abrir di|open dialog/i.test(el.textContent));
      b.scrollIntoView({ block: 'center' });
      b.click();
    })()`);
    await sleep(300);
  };
  const isOpen = () => evaluate(`document.querySelector('dialog')?.open === true`);
  const closeCalls = () => evaluate('window.__closeCalls');

  await openDemo();
  check('opens as modal from the button', await isOpen());
  check('focus moves inside the dialog', await evaluate(`document.querySelector('dialog').contains(document.activeElement)`),
    await evaluate(`document.activeElement.tagName`));

  // Tab trap: 12 tabs, focus must never leave the dialog.
  let escaped = false;
  for (let i = 0; i < 12; i++) {
    await key('Tab', 'Tab', 9);
    if (!(await evaluate(`document.querySelector('dialog').contains(document.activeElement) || document.activeElement === document.body`))) escaped = true;
  }
  check('Tab keeps focus inside (12 presses)', !escaped);
  escaped = false;
  for (let i = 0; i < 6; i++) {
    await key('Tab', 'Tab', 9, { modifiers: 8 });
    if (!(await evaluate(`document.querySelector('dialog').contains(document.activeElement) || document.activeElement === document.body`))) escaped = true;
  }
  check('Shift+Tab keeps focus inside (6 presses)', !escaped);

  // Escape
  const before = await closeCalls();
  await key('Escape', 'Escape', 27);
  check('Escape closes it', !(await isOpen()));
  check('native close() called exactly once for Escape', (await closeCalls()) - before === 1,
    `calls=${(await closeCalls()) - before}`);
  check('focus returns to the opener button', await evaluate(`/abrir di|open dialog/i.test(document.activeElement.textContent)`));

  // Click inside panel padding must NOT close
  await openDemo();
  const panel = await evaluate(`(() => { const r = document.querySelector('dialog > div').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  await click(panel.x + 6, panel.y + 6);
  check('click on panel padding keeps it open', await isOpen());
  const titleRect = await evaluate(`(() => { const r = document.querySelector('dialog h2').getBoundingClientRect(); return { x: r.x + 4, y: r.y + r.height / 2 }; })()`);
  await click(titleRect.x, titleRect.y);
  check('click on the title keeps it open', await isOpen());

  // Backdrop click closes
  await evaluate(`(() => { window.__clickTargets = []; document.addEventListener('click', (e) => window.__clickTargets.push(e.target.tagName + ':' + (e.target === document.querySelector('dialog'))), true); })()`);
  console.log("   elementFromPoint(900,600):", await evaluate(`(() => { const e = document.elementFromPoint(900, 600); return e.tagName + (e === document.querySelector("dialog") ? " (the dialog)" : ""); })()`)); await click(900, 600);
  console.log('   click targets:', await evaluate('JSON.stringify(window.__clickTargets)'), 'open:', await isOpen());
  check('click on the backdrop closes it', !(await isOpen()));

  // Footer button closes
  await openDemo();
  await evaluate(`(() => { const btns = [...document.querySelectorAll('dialog footer button')]; btns[btns.length - 1].click(); })()`);
  await sleep(300);
  const stillOpen = await isOpen();
  // The first footer button may be the primary action; try the other if still open.
  if (stillOpen) {
    await evaluate(`(() => { const btns = [...document.querySelectorAll('dialog footer button')]; btns[0].click(); })()`);
    await sleep(300);
  }
  check('a footer button closes it', !(await isOpen()));

  // Re-open after closing works repeatedly
  await openDemo();
  const again = await isOpen();
  await key('Escape', 'Escape', 27);
  check('re-open and Escape again works', again && !(await isOpen()));

  ws.close();
} catch (error) {
  console.error('dialogtest error:', error.message);
  results.push(false);
} finally {
  proc.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* ignore */ }
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}
