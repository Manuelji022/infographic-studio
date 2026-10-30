// CDP behaviour tests for the Wave 3 composites (PromptComposer, ShareDialog, UserMenu).
// Usage: node composites-test.mjs (dev server on :3000)
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
  await send('Browser.grantPermissions', { origin: 'http://localhost:3000', permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(250);
  await sleep(1500);
  const text = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);

  // ---- PromptComposer (last form in #composer is the interactive demo)
  const demo = `(() => { const f = document.querySelectorAll('#composer form'); return f[f.length - 1]; })()`;
  await evaluate(`${demo}.scrollIntoView({ block: 'center' })`);
  await evaluate(`${demo}.querySelector('textarea').focus()`);
  const btnDisabled = () => evaluate(`${demo}.querySelector('button[type=submit]').disabled`);
  check('empty: submit is disabled', await btnDisabled());
  await send('Input.insertText', { text: 'Hola mundo' });
  await sleep(300);
  check('typing enables submit', !(await btnDisabled()));
  check('counter shows 10 characters', /^10\b/.test(await evaluate(`${demo}.querySelector('[aria-live=polite]').textContent`)),
    await evaluate(`${demo}.querySelector('[aria-live=polite]').textContent`));
  check('no warning under the limit', (await evaluate(`${demo}.querySelectorAll('aside').length`)) === 0);
  await evaluate(`(() => { const t = ${demo}.querySelector('textarea'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, 'x'.repeat(30001)); t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(400);
  check('warning appears above 30000 characters', (await evaluate(`${demo}.querySelectorAll('aside').length`)) === 1);
  check('counter shows 30001 characters', /30[.,  ]?001/.test(await evaluate(`${demo}.querySelector('[aria-live=polite]').textContent`)),
    await evaluate(`${demo}.querySelector('[aria-live=polite]').textContent`));
  check('submit still allowed above the warning', !(await btnDisabled()));
  check('options are collapsed by default', !(await evaluate(`${demo}.querySelector('details').open`)));
  await evaluate(`${demo}.querySelector('summary').click()`);
  await sleep(200);
  check('options open on click and show 4 fields', (await evaluate(`${demo}.querySelector('details').open`)) &&
    (await evaluate(`${demo}.querySelectorAll('details input, details select').length`)) === 4);
  await evaluate(`${demo}.querySelector('button[type=submit]').click()`);
  await sleep(300);
  check('submitting: spinner shown and button disabled', (await evaluate(`${demo}.querySelectorAll('[role=status]').length`)) >= 1 && (await btnDisabled()));
  await sleep(2000);
  check('back to idle after the simulated submit', !(await btnDisabled()));
  await evaluate(`${demo}.scrollIntoView({ block: 'center' })`);
  await send('Page.captureScreenshot', { format: 'png' }).then((r) => {
    fs.writeFileSync(process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'composer-options-open.png') : path.join(os.tmpdir(), 'composer-options-open.png'), Buffer.from(r.result.data, 'base64'));
  });

  // ---- ErrorMessage inside the composer error demo
  const errBox = `document.querySelector('#composer form:has([aria-live=polite] svg) [aria-live=polite]:has(details)')`;
  check('error shows retry action and collapsed reference', (await evaluate(`!!${errBox}?.querySelector('button')`)) &&
    !(await evaluate(`${errBox}.querySelector('details').open`)));
  await evaluate(`${errBox}.querySelector('summary').click()`);
  check('reference opens and shows the ID', /req_/.test(await evaluate(`${errBox}.querySelector('code').textContent`)));

  // ---- ShareDialog: copy link
  await evaluate(`[...document.querySelectorAll('#dialogs button')].find((b) => /con enlace|with link/i.test(b.textContent)).click()`);
  await sleep(400);
  check('ShareDialog opens as modal', await evaluate(`[...document.querySelectorAll('dialog')].some((d) => d.open)`));
  const copyBtn = `[...document.querySelectorAll('dialog[open] button')].find((b) => /copiar|copy/i.test(b.textContent))`;
  await evaluate(`${copyBtn}.click()`);
  await sleep(400);
  check('clipboard holds the share URL', (await evaluate(`navigator.clipboard.readText().catch((e) => 'ERR ' + e.message)`)) === 'https://example.com/s/abc123',
    await evaluate(`navigator.clipboard.readText().catch((e) => 'ERR ' + e.message)`));
  check('button shows the copied state', await evaluate(`/copiado|copied/i.test(document.querySelector('dialog[open]').textContent)`));
  await sleep(2300);
  check('copied state reverts after 2 s', await evaluate(`!/copiado|copied/i.test(document.querySelector('dialog[open]').textContent)`));
  await key('Escape', 'Escape', 27);
  check('Escape closes the ShareDialog', !(await evaluate(`[...document.querySelectorAll('dialog')].some((d) => d.open)`)));

  // ---- UserMenu (first one in #navigation)
  await evaluate(`document.querySelector('#navigation').scrollIntoView()`);
  const trigger = `document.querySelector('#navigation [popovertarget]')`;
  const panelOpen = `document.getElementById(${trigger}.getAttribute('popovertarget')).matches(':popover-open')`;
  await evaluate(`${trigger}.focus()`);
  await evaluate(`${trigger}.click()`);
  await sleep(300);
  check('UserMenu opens on click', await evaluate(panelOpen));
  await key('Escape', 'Escape', 27);
  check('Escape closes the UserMenu', !(await evaluate(panelOpen)));
  check('focus returns to the trigger', await evaluate(`document.activeElement === ${trigger}`));
  await evaluate(`${trigger}.click()`);
  await sleep(300);
  const rect = await evaluate(`(() => { const r = document.querySelector('#navigation h3').getBoundingClientRect(); return { x: r.x + 2, y: r.y + 2 }; })()`);
  await click(rect.x, rect.y);
  check('clicking outside closes the UserMenu', !(await evaluate(panelOpen)));
  await evaluate(`${trigger}.click()`);
  await sleep(300);
  const before = await text('#navigation');
  await evaluate(`[...document.getElementById(${trigger}.getAttribute('popovertarget')).querySelectorAll('button')][0].click()`);
  await sleep(300);
  check('selecting an item runs onSelect and closes the panel', (await text('#navigation')) !== before && !(await evaluate(panelOpen)));
  // keyboard: Tab from trigger reaches the first item
  await evaluate(`${trigger}.focus()`);
  await key('Enter', 'Enter', 13, { text: '\r' });
  await sleep(300);
  console.log('   open after Enter:', await evaluate(panelOpen));
  await key('Tab', 'Tab', 9);
  check('keyboard: Tab from the trigger reaches a menu item', await evaluate(`document.activeElement.closest('[popover]') !== null`),
    await evaluate(`document.activeElement.tagName`));
  await key('Escape', 'Escape', 27);

  ws.close();
} catch (error) {
  console.error('composites-test error:', error.message);
  results.push(false);
} finally {
  proc.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* ignore */ }
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}
