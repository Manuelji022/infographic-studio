// End-to-end check of the change history (UI_EXPERIENCE §4.12): panel rows, restore to an entry,
// restore to the original, redo after restore, and truncation of the redo tail on a new edit.
// Also the Escape-from-iframe polish (a key pressed inside the frame closes the mobile chat).
// Driven in a real Chrome over CDP, same pattern as blocks-e2e.mjs.
// Usage: node scripts/dev/history-e2e.mjs [baseUrl]   (dev server running; default http://localhost:3000)
// Repeatable: if /i/gasto-publico carries edits from an earlier run, the script restores the original first.
// Writes design-system/reports/history-e2e/report.json + report.md and the screenshots in
// design-system/reports/shots/ui-history/. Exit code 1 when any check fails.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3000';
const root = path.resolve(import.meta.dirname, '../..');
const reportDir = path.join(root, 'design-system/reports/history-e2e');
const shotDir = path.join(root, 'design-system/reports/shots/ui-history');
fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9800 + Math.floor(Math.random() * 150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'history-e2e-'));
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
  more: 'Más acciones',
  historyItem: 'Historial',
  restore: 'Restaurar',
  original: 'Versión original',
  current: 'Versión actual',
  restored: 'Versión restaurada.',
  undo: 'Deshacer',
  redo: 'Rehacer',
  chip: 'Bloque seleccionado',
  chatOpen: 'Abrir el chat',
  chatClose: 'Cerrar el chat',
  changedOne: 'He actualizado 1 bloque:',
  notPossible: 'No puedo hacer ese cambio con los datos del texto original.',
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
    fs.writeFileSync(path.join(shotDir, name), Buffer.from(r.result.data, 'base64'));
    return `design-system/reports/shots/ui-history/${name}`;
  };

  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Network.setCookie', { name: 'better-auth.session_token', value: 'x.y', url: base });
  await send('Network.setCookie', { name: 'locale', value: 'es', url: base });

  async function open(pathname, { width, height = 900, mobile = false, scheme = 'light' }) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Page.navigate', { url: `${base}${pathname}` });
    await waitFor(() => evaluate(`!!document.querySelector('[data-block-layer]') && document.querySelector('iframe')?.contentDocument?.querySelector('[data-block-id]') != null`), 'workspace + iframe blocks', 30000);
    await sleep(900);
  }

  // ---- helpers over the iframe document (same-origin, read-only from the test)
  const frameJs = (body) => `(() => { const d = document.querySelector('iframe').contentDocument; ${body} })()`;
  const blockMap = () => evaluate(frameJs(`const o = {}; d.querySelectorAll('[data-block-id]').forEach((e) => { o[e.dataset.blockId] = e.outerHTML; }); return o;`));
  const docHash = () => evaluate(`(async () => {
    const t = await (await fetch('/i/gasto-publico/download?locale=es&theme=light')).text();
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') + ':' + t.length;
  })()`);
  const center = (blockId) => evaluate(frameJs(`
    const e = d.querySelector('[data-block-id="${blockId}"]'); e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect(); const f = document.querySelector('iframe').getBoundingClientRect();
    return { x: Math.round(f.left + r.left + r.width / 2), y: Math.round(f.top + r.top + Math.min(r.height / 2, 60)) };`));
  const diffIds = (a, b) => Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]);
  // A leaf text block: a block root with a paragraph and no chart and no nested block.
  const textBlockId = () => evaluate(frameJs(`const e = [...d.querySelectorAll('[data-block-id]')].find((x) => x.querySelector('p') && !x.querySelector('.ig-chart, [data-chart], svg') && x.querySelectorAll('[data-block-id]').length === 0); return e ? e.dataset.blockId : null;`));
  const logCount = () => evaluate(`document.querySelectorAll('#workspace-chat [role=log] > li').length`);
  const lastReply = () => evaluate(`(() => { const li = [...document.querySelectorAll('#workspace-chat [role=log] > li')].pop(); return li ? { text: li.innerText, chips: [...li.querySelectorAll('ul button')].map((b) => b.textContent.trim()), hasUndo: [...li.querySelectorAll('button')].some((b) => b.textContent.trim() === '${ES.undo}'), working: li.innerText.includes('Trabajando') } : null; })()`);
  const sendChat = async (text) => {
    await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat textarea') && !document.querySelector('#workspace-chat textarea').disabled`), 'chat composer ready', 8000);
    await evaluate(`document.querySelector('#workspace-chat textarea').focus()`);
    await send('Input.insertText', { text });
    await key('Enter', 'Enter', 13);
  };
  const waitReply = async (previousCount) => {
    try {
      return await waitFor(async () => {
        const r = await lastReply();
        if (!r || (await logCount()) < previousCount + 2 || r.working) return null;
        if (r.text.includes(ES.notPossible)) return r;
        return r.chips.length > 0 && r.hasUndo ? r : null;
      }, 'chat reply', 25000);
    } catch (error) {
      const last = await lastReply();
      throw new Error(`${error.message}; log=${await logCount()} (was ${previousCount}); last=${JSON.stringify(last)}`);
    }
  };
  const deselect = async () => {
    await evaluate(`document.activeElement?.blur()`);
    await key('Escape', 'Escape', 27);
    await sleep(200);
  };
  const barButton = (label) => evaluate(`(() => { const b = document.querySelector('header button[aria-label="${label}"]'); return b ? { disabled: b.disabled } : null; })()`);
  const panelOpen = () => evaluate(`!!document.querySelector('dialog[open] [aria-label]') && !!document.querySelector('dialog[open] ol')`);
  // Rows of the open history panel, newest first, as {text, current, restorable}.
  const panelRows = () => evaluate(`[...document.querySelectorAll('dialog[open] ol > li')].map((li) => ({ text: li.innerText, current: li.getAttribute('aria-current') === 'true', restorable: [...li.querySelectorAll('button')].some((b) => b.textContent.trim() === '${ES.restore}') }))`);
  const openPanel = async () => {
    await evaluate(`document.querySelector('header button[aria-label="${ES.more}"]').click()`);
    await waitFor(() => evaluate(`!!document.querySelector('header button[aria-label="${ES.more}"][aria-expanded="true"]')`), 'more menu open', 5000);
    await evaluate(`[...document.querySelectorAll('header button[data-item]')].find((b) => b.textContent.trim() === '${ES.historyItem}').click()`);
    await waitFor(() => panelOpen(), 'history panel', 5000);
    await sleep(300);
  };
  const closePanel = async () => {
    await evaluate(`[...document.querySelectorAll('dialog[open] button')].find((b) => b.textContent.trim() === 'Cerrar').click()`);
    await waitFor(() => evaluate(`!document.querySelector('dialog[open]')`), 'panel closed', 5000);
    await sleep(200);
  };
  const clickRestore = async (rowText) => {
    await evaluate(`(() => { const li = [...document.querySelectorAll('dialog[open] ol > li')].find((x) => x.innerText.includes(${JSON.stringify(rowText)})); li.querySelector('button').click(); })()`);
  };
  const clickRestoreOriginal = async () => {
    await evaluate(`(() => { const li = [...document.querySelectorAll('dialog[open] ol > li')].pop(); li.querySelector('button').click(); })()`);
  };
  const notice = () => evaluate(`document.querySelector('dialog[open] [role=status]')?.textContent ?? ''`);

  const G1 = 'Reduce el texto';
  const B1 = 'Estilo más minimalista';
  const G2 = 'Destaca las conclusiones';
  const G3 = 'Destaca las conclusiones de nuevo';

  // ============ 1. Seed state
  await open('/i/gasto-publico', { width: 1280 });
  const S = 'history-1280';
  // The mock store lives in the dev server, so an earlier run may have left edits. Restoring the
  // original first makes the run repeatable: the first new edit then drops the whole redo tail.
  const leftover = (await barButton(ES.undo))?.disabled === false;
  if (leftover) {
    await openPanel();
    await clickRestoreOriginal();
    await waitFor(async () => (await barButton(ES.undo))?.disabled === true, 'reset to the original', 8000);
    await closePanel();
    await sleep(500);
  }
  check(S, 'starts at the original version (undo disabled, reset first if an earlier run left edits)', (await barButton(ES.undo))?.disabled === true, leftover ? 'reset from earlier edits' : 'clean');
  const pristine = await docHash();
  const pristineMap = await blockMap();
  check(S, 'seed document loaded', Object.keys(pristineMap).length > 0, `${Object.keys(pristineMap).length} blocks`);

  // ============ 2. Two global edits and one block edit
  await sendChat(G1);
  await waitReply(0);
  const r1 = await lastReply();
  check(S, 'edit 1 (global) is applied', r1.chips.length > 0 && r1.hasUndo, r1.text.replace(/\n/g, ' / '));
  const after1 = await docHash();
  const after1Map = await blockMap();
  check(S, 'edit 1 changed the stored document', after1 !== pristine);
  await deselect();

  const bId = await textBlockId();
  check(S, 'a leaf text block exists for the block edit', !!bId, bId);
  const at = await center(bId);
  const n2 = await logCount();
  await click(at.x, at.y);
  await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), 'block selected', 5000);
  await sendChat(B1);
  await waitReply(n2);
  const r2 = await lastReply();
  check(S, 'edit 2 (block) is applied to exactly 1 block', r2.text.includes(ES.changedOne) && r2.chips.length === 1, r2.text.replace(/\n/g, ' / '));
  const after2 = await docHash();
  const after2Map = await blockMap();
  check(S, 'edit 2 changed the stored document', after2 !== after1);
  const changed2 = diffIds(after1Map, after2Map);
  check(S, 'edit 2 changed the selected block root', changed2.includes(bId), JSON.stringify(changed2));
  await deselect();

  const n3 = await logCount();
  await sendChat(G2);
  await waitReply(n3);
  const r3 = await lastReply();
  check(S, 'edit 3 (global) is applied', r3.chips.length > 0 && r3.hasUndo, r3.text.replace(/\n/g, ' / '));
  const after3 = await docHash();
  await blockMap();
  check(S, 'edit 3 changed the stored document', after3 !== after2);
  await deselect();

  // ============ 3. Panel: 3 rows + original, newest first, current marker
  await openPanel();
  let rows = await panelRows();
  check(S, 'panel lists 3 edits plus the original version', rows.length === 4, `${rows.length} rows`);
  check(S, 'newest edit is first and is the current state', rows[0]?.text.includes(G2) && rows[0]?.current === true && !rows[0]?.restorable, rows[0]?.text.replace(/\n/g, ' / '));
  check(S, 'rows follow the edit order newest first', rows[1]?.text.includes(B1) && rows[2]?.text.includes(G1), JSON.stringify(rows.map((r) => r.text.split('\n')[1] ?? r.text)));
  check(S, 'the block edit row names the affected block', rows[1]?.text.includes('Bloques afectados:'), rows[1]?.text.replace(/\n/g, ' / '));
  check(S, 'original version is the last row and is restorable', rows[3]?.text.includes(ES.original) && rows[3]?.restorable === true);
  check(S, 'every non-current row has a Restore button', rows.slice(1).every((r) => r.restorable) && !rows[0].restorable);
  const shotLight1280 = await shot('panel-1280-light.png');

  // ============ 4. Restore to the first edit
  await clickRestore(G1);
  await waitFor(async () => (await notice()) === ES.restored, 'restored announcement', 8000);
  check(S, 'restore announces "Versión restaurada." in the panel live region', (await notice()) === ES.restored, await notice());
  await waitFor(async () => (await docHash()) === after1, 'document equal to edit 1', 8000).catch(() => null);
  const restored1 = await docHash();
  const restored1Map = await blockMap();
  check(S, 'restored document is byte-identical to the snapshot after edit 1 (download hash)', restored1 === after1, `${after1.slice(-12)} vs ${restored1.slice(-12)}`);
  check(S, 'restored document equals the snapshot after edit 1 per data-block-id root', diffIds(after1Map, restored1Map).length === 0 && Object.keys(after1Map).length === Object.keys(restored1Map).length, JSON.stringify(diffIds(after1Map, restored1Map)));
  rows = await panelRows();
  check(S, 'after restoring, the current marker is on the first edit', rows[2]?.current === true && rows[0]?.current === false, rows.map((r) => (r.current ? 'current' : 'other')).join(','));
  check(S, 'later entries stay in the list (redo tail kept, 4 rows)', rows.length === 4, `${rows.length} rows`);
  check(S, 'redo is still possible after restoring to edit 1', (await barButton(ES.redo))?.disabled === false);

  // ============ 5. Restore to the original version
  await clickRestoreOriginal();
  await waitFor(async () => (await docHash()) === pristine, 'document equal to the seed', 8000).catch(() => null);
  const restoredOriginal = await docHash();
  const restoredOriginalMap = await blockMap();
  check(S, 'restoring to the original gives the pristine seed (download hash)', restoredOriginal === pristine, `${pristine.slice(-12)} vs ${restoredOriginal.slice(-12)}`);
  check(S, 'restoring to the original gives the pristine seed per data-block-id root', diffIds(pristineMap, restoredOriginalMap).length === 0, JSON.stringify(diffIds(pristineMap, restoredOriginalMap)));
  rows = await panelRows();
  check(S, 'original is now the current state', rows[3]?.current === true && rows.slice(0, 3).every((r) => !r.current));
  check(S, 'undo is disabled at the original version', (await barButton(ES.undo))?.disabled === true);
  check(S, 'redo is possible from the original', (await barButton(ES.redo))?.disabled === false);

  // ============ 6. Restore to the latest edit again (forward), then a new edit truncates redo
  await clickRestore(G2);
  await waitFor(async () => (await docHash()) === after3, 'document equal to edit 3', 8000).catch(() => null);
  check(S, 'restoring forward to the newest edit gives its snapshot (download hash)', (await docHash()) === after3);
  await closePanel();
  check(S, 'focus returns to the More trigger when the panel closes', await evaluate(`document.activeElement?.getAttribute('aria-label') === '${ES.more}'`));

  // Go back to edit 1 so a redo tail exists, then make a new edit.
  await openPanel();
  await clickRestore(G1);
  await waitFor(async () => (await docHash()) === after1, 'document back at edit 1', 8000).catch(() => null);
  await closePanel();
  check(S, 'redo possible before the new edit', (await barButton(ES.redo))?.disabled === false);
  await deselect();
  const n4 = await logCount();
  await sendChat(G3);
  await waitReply(n4);
  const r4 = await lastReply();
  check(S, 'new edit after restoring is applied', r4.chips.length > 0 && r4.hasUndo, r4.text.replace(/\n/g, ' / '));
  await waitFor(async () => (await barButton(ES.redo))?.disabled === true, 'redo tail truncated', 8000).catch(() => null);
  check(S, 'a new edit truncates the redo tail (redo disabled)', (await barButton(ES.redo))?.disabled === true);
  await openPanel();
  rows = await panelRows();
  // The applied prefix (edit 1) stays; the redo tail (block edit and edit 2) is dropped.
  const lines = (r) => r.text.split('\n').map((line) => line.trim());
  check(S, 'after truncation the list is new edit, edit 1, original (3 rows; block and edit 2 gone)', rows.length === 3 && lines(rows[0]).includes(G3) && rows[0].current && lines(rows[1]).includes(G1) && !rows.some((r) => lines(r).includes(B1) || lines(r).includes(G2)), JSON.stringify(rows.map((r) => r.text.replace(/\n/g, ' / '))));
  await shot('panel-1280-light-after-truncate.png');
  await closePanel();

  // ============ 7. Dark and phone widths (screenshots of the panel)
  const shots = { light1280: shotLight1280 };
  await open('/i/gasto-publico', { width: 1280, scheme: 'dark' });
  await openPanel();
  shots.dark1280 = await shot('panel-1280-dark.png');
  await closePanel();
  await open('/i/gasto-publico', { width: 360, height: 800, mobile: true, scheme: 'light' });
  await openPanel();
  shots.light360 = await shot('panel-360-light.png');
  await closePanel();
  await open('/i/gasto-publico', { width: 360, height: 800, mobile: true, scheme: 'dark' });
  await openPanel();
  shots.dark360 = await shot('panel-360-dark.png');
  const overflow360 = await evaluate(`document.querySelector('dialog[open]').scrollWidth > document.querySelector('dialog[open]').clientWidth + 1 || document.documentElement.scrollWidth > window.innerWidth + 1`);
  check('history-360', 'no horizontal overflow in the panel at 360 px', overflow360 === false);
  await closePanel();

  // ============ 8. Escape pressed inside the iframe closes the mobile chat overlay
  await open('/i/gasto-publico', { width: 360, height: 800, mobile: true, scheme: 'light' });
  const chatToggle = `document.querySelector('header button[aria-label="${ES.chatOpen}"]')`;
  await evaluate(`${chatToggle}.click()`);
  await waitFor(() => evaluate(`!!document.querySelector('aside#workspace-chat')`), 'mobile chat overlay open', 5000);
  await evaluate(`document.querySelector('iframe').focus()`);
  await key('Escape', 'Escape', 27);
  const closedByFrameEsc = await waitFor(() => evaluate(`!document.querySelector('aside#workspace-chat')`), 'chat overlay closed by Escape in iframe', 4000).catch(() => false);
  check('polish', 'Escape pressed inside the iframe closes the mobile chat overlay', closedByFrameEsc === true);
  const toggleLabel = await evaluate(`document.querySelector('header button[aria-controls="workspace-chat"]')?.getAttribute('aria-label') ?? null`);
  check('polish', 'bar chat toggle is named "Abrir el chat" when the chat is closed', toggleLabel === ES.chatOpen, toggleLabel);
  await evaluate(`${chatToggle}.click()`);
  await waitFor(() => evaluate(`!!document.querySelector('aside#workspace-chat')`), 'chat reopened', 5000);
  const panelCloseLabels = await evaluate(`[...document.querySelectorAll('aside#workspace-chat button')].map((b) => b.getAttribute('aria-label'))`);
  check('polish', 'the chat panel close button is not named like the bar toggle', panelCloseLabels.includes('Cerrar') && !panelCloseLabels.includes(ES.chatClose), JSON.stringify(panelCloseLabels));

  // ---- report
  const failed = checks.filter((c) => !c.ok);
  report.checks = checks;
  report.screenshots = shots;
  report.summary = { total: checks.length, passed: checks.length - failed.length, failed: failed.length };
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const md = [
    '# History panel E2E',
    '',
    `Base: ${base}  ·  ${report.summary.passed}/${report.summary.total} checks passed`,
    '',
    '| Scenario | Check | Result | Detail |',
    '| --- | --- | --- | --- |',
    ...checks.map((c) => `| ${c.scenario} | ${c.name} | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`),
    '',
    '## Screenshots',
    ...Object.entries(shots).map(([k, v]) => `- ${k}: ${v}`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(reportDir, 'report.md'), md);
  console.log(`\n${report.summary.passed}/${report.summary.total} passed -> design-system/reports/history-e2e/report.{json,md}`);
  if (failed.length) process.exitCode = 1;
} catch (error) {
  console.error('FATAL', error);
  checks.push({ scenario: 'fatal', name: 'run aborted', ok: false, detail: String(error?.message ?? error) });
  process.exitCode = 1;
} finally {
  proc.kill();
  // Chrome may still be writing to the profile for a moment after kill(); retry, and never fail the run on cleanup.
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* the profile is in tmp */ }
}
