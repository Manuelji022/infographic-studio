// End-to-end tour of the mockup phase, in one run: login (simulated cookie), generate with the mock,
// workspace at 1280 px, select one block, ask for a change that must touch only that block, undo,
// share, open the public link without a session cookie, and the 404s for an unknown and a revoked token.
// Driven in a real Chrome over CDP, same pattern as history-e2e.mjs and blocks-e2e.mjs.
// Usage: node scripts/dev/tour-e2e.mjs [baseUrl]   (dev server running; default http://localhost:3000)
// Writes design-system/reports/tour-e2e/report.json + report.md and two screenshots in the same folder.
// Exit code 1 when any check fails. A step that fails for a real app bug is recorded as ok: false and
// the next steps that do not depend on it still run.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3000';
const root = path.resolve(import.meta.dirname, '../..');
const reportDir = path.join(root, 'design-system/reports/tour-e2e');
fs.mkdirSync(reportDir, { recursive: true });

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9600 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-e2e-'));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [];
function check(scenario, name, ok, detail = '') {
  checks.push({ scenario, name, ok: Boolean(ok), detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${scenario}] ${name}${detail ? '  ' + detail : ''}`);
}

// Spanish UI strings (the test runs with the locale=es cookie).
const ES = {
  chip: 'Bloque seleccionado',
  notPossible: 'No puedo hacer ese cambio con los datos del texto original.',
  changedOne: 'He actualizado 1 bloque:',
  undo: 'Deshacer',
  share: 'Compartir',
  createLink: 'Crear enlace',
  articleType: 'Artículo',
};
const SESSION_COOKIE = 'better-auth.session_token';
const TEXT = 'Texto de prueba del recorrido E2E sobre pensiones y su financiación en los próximos años.';
const EDIT = 'cambia a columnas';

// Runs in the page: maps each data-block-id root to its own markup, with nested block roots replaced
// by a marker. A parent therefore only differs when its own content differs, so the comparison
// shows the block that changed and not its ancestors (their outerHTML contains it).
const OWN_BLOCKS = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = {};
  doc.querySelectorAll('[data-block-id]').forEach((el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[data-block-id]').forEach((child) => {
      const mark = doc.createElement('span');
      mark.setAttribute('data-child-block', child.getAttribute('data-block-id'));
      child.replaceWith(mark);
    });
    out[el.getAttribute('data-block-id')] = copy.outerHTML;
  });
  return out;
};

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

let send, evaluate;
async function waitFor(fn, what, timeout = 15000) {
  const end = Date.now() + timeout;
  for (;;) {
    let value;
    try { value = await fn(); } catch { value = null; }
    if (value) return value;
    if (Date.now() > end) throw new Error(`timeout waiting for ${what}`);
    await sleep(100);
  }
}

const report = { startedAt: new Date().toISOString(), base, checks: [], summary: {} };

try {
  const ws = new WebSocket(await pageSocket());
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params }));
  });
  evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception ?? r.result.exceptionDetails));
    return r.result.result.value;
  };
  const key = async (name, code, vk) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: vk });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: vk });
    await sleep(250);
  };
  const mouse = async (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
  const click = async (x, y) => { await mouse('mouseMoved', x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); await sleep(250); };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(reportDir, name), Buffer.from(r.result.data, 'base64'));
    return `design-system/reports/tour-e2e/${name}`;
  };

  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
  // Step 1 cookies: a fake Better Auth session (the proxy only checks that it exists) and the locale.
  const setCookies = async () => {
    await send('Network.setCookie', { name: SESSION_COOKIE, value: 'x.y', url: base });
    await send('Network.setCookie', { name: 'locale', value: 'es', url: base });
  };
  await setCookies();

  const go = async (pathname) => {
    await send('Page.navigate', { url: `${base}${pathname}` });
    await waitFor(() => evaluate(`document.readyState === 'complete'`), 'page load', 30000);
  };
  const frameReady = `!!document.querySelector('[data-block-layer]') && document.querySelector('iframe')?.contentDocument?.querySelector('[data-block-id]') != null`;
  const frameJs = (body) => `(() => { const d = document.querySelector('iframe').contentDocument; ${body} })()`;
  const chartBlockId = () => evaluate(frameJs(`const e = d.querySelector('[data-block-id] > .ig-chart, [data-block-id] .ig-chart-figure, [data-block-id] svg'); return e ? e.closest('[data-block-id]').dataset.blockId : null;`));
  const center = (blockId) => evaluate(frameJs(`
    const e = d.querySelector('[data-block-id="${blockId}"]'); e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect(); const f = document.querySelector('iframe').getBoundingClientRect();
    return { x: Math.round(f.left + r.left + r.width / 2), y: Math.round(f.top + r.top + Math.min(r.height / 2, 60)) };`));
  const logCount = () => evaluate(`document.querySelectorAll('#workspace-chat [role=log] > li').length`);
  const lastReply = () => evaluate(`(() => { const li = [...document.querySelectorAll('#workspace-chat [role=log] > li')].pop(); return li ? { text: li.innerText, chips: [...li.querySelectorAll('ul button')].map((b) => b.textContent.trim()), hasUndo: [...li.querySelectorAll('button')].some((b) => b.textContent.trim() === '${ES.undo}'), working: li.innerText.includes('Trabajando') } : null; })()`);
  const sendChat = async (text) => {
    await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat textarea') && !document.querySelector('#workspace-chat textarea').disabled`), 'chat composer ready', 8000);
    await evaluate(`document.querySelector('#workspace-chat textarea').focus()`);
    await send('Input.insertText', { text });
    await key('Enter', 'Enter', 13);
  };
  // Settled = the request and its reply are logged, the reply is no longer working, and either it is a
  // refusal or it lists its changed blocks with Undo (the history entry arrives after the action returns).
  const waitReply = async (previousCount) => waitFor(async () => {
    const r = await lastReply();
    if (!r || (await logCount()) < previousCount + 2 || r.working) return null;
    if (r.text.includes(ES.notPossible)) return r;
    return r.chips.length > 0 && r.hasUndo ? r : null;
  }, 'chat reply', 25000);
  const downloadUrl = (infographicId) => `/i/${infographicId}/download?locale=es&theme=light`;
  // Keeps the download's text in the page (window.__tour[name]); nothing large crosses the CDP socket.
  const snapshot = (name, url) => evaluate(`(async () => {
    const t = await (await fetch(${JSON.stringify(url)}, { cache: 'no-store' })).text();
    window.__tour = window.__tour ?? {}; window.__tour[${JSON.stringify(name)}] = t; return t.length;
  })()`);
  const installOwn = () => evaluate(`window.__tourOwn = (${OWN_BLOCKS.toString()}); true`);
  // Ids of the blocks whose own markup differs between two snapshots.
  const diffBlocks = async (a, b) => {
    await installOwn();
    return evaluate(`(() => {
      const x = window.__tourOwn(window.__tour[${JSON.stringify(a)}]); const y = window.__tourOwn(window.__tour[${JSON.stringify(b)}]);
      return { changed: [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => x[k] !== y[k]), before: Object.keys(x).length, after: Object.keys(y).length };
    })()`);
  };

  // A step runs one check. A thrown error becomes a failed check; steps that need an earlier result skip.
  const need = (...values) => { if (values.some((v) => !v)) throw new Error('skipped: an earlier step it depends on failed'); };
  const step = async (scenario, name, fn) => {
    try {
      const r = await fn();
      check(scenario, name, r.ok, r.detail);
      return r;
    } catch (error) {
      check(scenario, name, false, String(error?.message ?? error).slice(0, 300));
      return { ok: false, detail: String(error?.message ?? error) };
    }
  };

  const ctx = { id: null, title: null, chartId: null, chartName: null, token: null };

  // 1. Login (simulated): the cookie is set; the home page must render and not redirect to /login.
  await step('login', 'the fake session cookie opens / without redirect to /login', async () => {
    await go('/');
    await sleep(600);
    const pathname = await evaluate('location.pathname');
    const composer = await evaluate(`!!document.querySelector('textarea')`);
    return { ok: pathname === '/' && composer, detail: `path=${pathname}, composer=${composer}` };
  });

  // 2. Generate with the mock: type a text, pick "Artículo" if offered, submit, wait for /i/<new id>.
  await step('generate', 'the mock generation redirects to /i/<new id> (not pensiones)', async () => {
    await evaluate(`(() => { const t = document.querySelector('textarea'); t.focus(); t.select(); })()`);
    await send('Input.insertText', { text: TEXT });
    await waitFor(() => evaluate(`!!document.querySelector('form button[type=submit]:not([disabled])')`), 'submit enabled', 5000);
    let typeNote = 'type selector absent';
    const hasSelector = await evaluate(`!!document.querySelector('button[aria-haspopup=listbox]')`);
    if (hasSelector) {
      await evaluate(`document.querySelector('button[aria-haspopup=listbox]').click()`);
      await waitFor(() => evaluate(`!!document.querySelector('ul[role=listbox]')`), 'type list open', 5000);
      const picked = await evaluate(`(() => { const li = [...document.querySelectorAll('ul[role=listbox] li')].find((x) => x.firstElementChild?.textContent.trim() === '${ES.articleType}'); if (!li) return false; li.click(); return true; })()`);
      typeNote = picked ? `type=${ES.articleType}` : 'type "Artículo" not in the list';
      await sleep(200);
    }
    await waitFor(() => evaluate(`!!document.querySelector('form button[type=submit]:not([disabled])')`), 'submit enabled', 5000);
    await evaluate(`document.querySelector('form button[type=submit]').click()`);
    const pathname = await waitFor(async () => {
      const p = await evaluate('location.pathname');
      return /^\/i\/[^/]+$/.test(p) ? p : null;
    }, 'redirect to /i/<id>', 30000);
    const newId = pathname.split('/')[2];
    ctx.id = newId !== 'pensiones' ? newId : null;
    return { ok: newId !== 'pensiones', detail: `${pathname} (${typeNote})` };
  });

  // 3. Workspace: the iframe shows the blocks and the chat is visible at 1280 px.
  await step('workspace', 'the iframe shows data-block-id blocks and the chat is visible at 1280 px', async () => {
    need(ctx.id);
    await waitFor(() => evaluate(frameReady), 'iframe blocks', 30000);
    await sleep(900);
    const blocks = await evaluate(frameJs(`return d.querySelectorAll('[data-block-id]').length;`));
    const chat = await evaluate(`(() => { const el = document.querySelector('#workspace-chat'); if (!el) return null; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { w: Math.round(r.width), h: Math.round(r.height), visible: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 }; })()`);
    ctx.title = await evaluate('document.title');
    const viewport = await evaluate('innerWidth');
    const shotName = await shot('workspace-1280.png');
    return { ok: blocks > 0 && chat?.visible === true && viewport === 1280, detail: `${blocks} bloques, chat ${chat?.w}x${chat?.h} visible=${chat?.visible}, viewport ${viewport}px, ${shotName}` };
  });

  // 4. Select one block (click on it, as blocks-e2e does) and keep the download as "before".
  await step('select', 'one block is selected (context chip) and the download is saved as "before"', async () => {
    need(ctx.id);
    ctx.chartId = await chartBlockId();
    need(ctx.chartId);
    const at = await center(ctx.chartId);
    await click(at.x, at.y);
    await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), 'context chip', 5000);
    const chipText = await evaluate(`document.querySelector('#workspace-chat [aria-label="${ES.chip}"]').innerText`);
    ctx.chartName = chipText.split(':').slice(1).join(':').replace(/\s+/g, ' ').trim();
    await snapshot('before', downloadUrl(ctx.id));
    await installOwn();
    const count = await evaluate(`Object.keys(window.__tourOwn(window.__tour.before)).length`);
    return { ok: count > 0, detail: `selected ${ctx.chartId} (${chipText.replace(/\n/g, ' ')}); before: ${count} bloques` };
  });

  // 5. Ask for a change from the chat with the block selected; wait for the reply that lists the block.
  await step('edit', 'the chat edit reports exactly 1 changed block (the selected one) with Undo', async () => {
    need(ctx.id, ctx.chartId);
    const n = await logCount();
    await sendChat(EDIT);
    await waitReply(n);
    const reply = await lastReply();
    const ok = reply.text.includes(ES.changedOne) && reply.chips.length === 1 && reply.hasUndo;
    return { ok, detail: `${reply.text.replace(/\n/g, ' / ').slice(0, 160)} · chips=${JSON.stringify(reply.chips)}` };
  });

  // 6. Download again and compare block by block: only the selected block may change.
  await step('scope', 'after the edit only the selected block differs in the download', async () => {
    need(ctx.id, ctx.chartId);
    await snapshot('after', downloadUrl(ctx.id));
    const { changed, before, after } = await diffBlocks('before', 'after');
    const ok = changed.length === 1 && changed[0] === ctx.chartId && before === after;
    return { ok, detail: `${changed.length} bloque cambiado: ${changed.join(', ') || 'ninguno'} (seleccionado: ${ctx.chartId}; bloques ${before}→${after})` };
  });

  // 7. Undo from the bar: the download returns to the exact "before" HTML.
  await step('undo', 'Undo in the bar returns the download to the exact "before" HTML', async () => {
    need(ctx.id, ctx.chartId);
    await evaluate(`document.querySelector('header button[aria-label="${ES.undo}"]').click()`);
    const same = await waitFor(async () => {
      await snapshot('undone', downloadUrl(ctx.id));
      return evaluate(`window.__tour.before === window.__tour.undone`);
    }, 'download equal to before', 10000).then(() => true, () => false);
    return { ok: same, detail: same ? 'HTML identico al de antes' : 'HTML distinto al de antes tras deshacer' };
  });

  // 8. Share: create the link in the dialog and read /s/<token>.
  await step('share', 'the share dialog creates a link with a new token (not demo-*)', async () => {
    need(ctx.id);
    await evaluate(`[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === '${ES.share}').click()`);
    await waitFor(() => evaluate(`!!document.querySelector('dialog[open]')`), 'share dialog', 5000);
    await evaluate(`[...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === '${ES.createLink}').click()`);
    const link = await waitFor(() => evaluate(`(() => { const i = document.querySelector('dialog[open] input[readonly]'); return i && i.value.includes('/s/') ? i.value : null; })()`), 'share link', 10000);
    ctx.token = link.split('/s/')[1].replace(/\/+$/, '');
    const ok = ctx.token.length >= 20 && !ctx.token.startsWith('demo-');
    return { ok, detail: `/s/${ctx.token}` };
  });

  // 9. Open the link without a session cookie: the infographic must be visible.
  await step('public', 'the public link opens without a session cookie and shows the infographic', async () => {
    need(ctx.token);
    await send('Network.deleteCookies', { name: SESSION_COOKIE, url: base });
    await send('Network.deleteCookies', { name: 'locale', url: base });
    const cookieNames = (await send('Network.getCookies', { urls: [base] })).result.cookies.map((c) => c.name);
    await go(`/s/${ctx.token}`);
    await waitFor(() => evaluate(`!!document.querySelector('iframe')`), 'shared iframe', 15000);
    await sleep(600);
    const title = await evaluate('document.title');
    await shot('shared-public.png');
    const hasSession = cookieNames.includes(SESSION_COOKIE);
    return { ok: title.trim().length > 0 && !hasSession, detail: `title="${title}", iframe present, session cookie ${hasSession ? 'PRESENT' : 'absent'}` };
  });

  // 10. Unknown token: HTTP 404.
  await step('404', 'an unknown token answers HTTP 404', async () => {
    const status = await evaluate(`fetch('/s/token-que-no-existe', { cache: 'no-store' }).then((r) => r.status)`);
    return { ok: status === 404, detail: `HTTP ${status}` };
  });

  // 11. Revoked token from the seed: HTTP 404 (the UI does not say why).
  await step('404', 'a revoked token (demo-revocada) answers HTTP 404', async () => {
    const status = await evaluate(`fetch('/s/demo-revocada', { cache: 'no-store' }).then((r) => r.status)`);
    return { ok: status === 404, detail: `HTTP ${status}` };
  });

  report.generatedInfographic = ctx.id;
} catch (error) {
  console.error('FATAL', error);
  checks.push({ scenario: 'fatal', name: 'run aborted', ok: false, detail: String(error?.message ?? error) });
} finally {
  proc.kill();
  // Chrome may still be writing to the profile for a moment after kill(); retry, and never fail the run on cleanup.
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* the profile is in tmp */ }

  const failed = checks.filter((c) => !c.ok);
  report.checks = checks;
  report.summary = { total: checks.length, passed: checks.length - failed.length, failed: failed.length };
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const md = [
    '# Mockup tour E2E',
    '',
    `Base: ${base}  ·  generated infographic: ${report.generatedInfographic ?? 'none'}  ·  ${report.summary.passed}/${report.summary.total} checks passed`,
    '',
    'Command: `node scripts/dev/tour-e2e.mjs` (dev server on :3000, Chrome headless over CDP).',
    '',
    '| Scenario | Check | Result | Detail |',
    '| --- | --- | --- | --- |',
    ...checks.map((c) => `| ${c.scenario} | ${c.name} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`),
    '',
    '## Screenshots',
    '- workspace-1280.png',
    '- shared-public.png',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(reportDir, 'report.md'), md);
  console.log(`\n${report.summary.passed}/${report.summary.total} passed -> design-system/reports/tour-e2e/report.{json,md}`);
  process.exitCode = failed.length || checks.length === 0 ? 1 : 0;
}
