// End-to-end check of block selection, local (single-block) editing, undo, comments and the
// touch/keyboard routes, driven in a real Chrome over CDP (UI_EXPERIENCE §4.3, task U6).
// Usage: node scripts/dev/blocks-e2e.mjs [baseUrl]   (dev server running; default http://localhost:3000)
// Writes design-system/reports/blocks-e2e/report.json + report.md and the screenshots in
// design-system/reports/shots/ui-blocks/. Exit code 1 when any check fails.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3000';
const root = path.resolve(import.meta.dirname, '../..');
const reportDir = path.join(root, 'design-system/reports/blocks-e2e');
const shotDir = path.join(root, 'design-system/reports/shots/ui-blocks');
fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'blocks-e2e-'));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [];
const notes = [];
function check(scenario, name, ok, detail = '') {
  checks.push({ scenario, name, ok: Boolean(ok), detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${scenario}] ${name}${detail ? '  ' + detail : ''}`);
}

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

const ES = {
  chip: 'Bloque seleccionado',
  notPossible: 'No puedo hacer ese cambio con los datos del texto original.',
  changedOne: 'He actualizado 1 bloque:',
  undo: 'Deshacer',
};

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
  send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params }));
  });
  evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception ?? r.result.exceptionDetails));
    return r.result.result.value;
  };
  const key = async (name, code, vk, extra = {}) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: vk, ...extra });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: vk, ...extra });
    await sleep(200);
  };
  const mouse = async (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
  const click = async (x, y) => { await mouse('mouseMoved', x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); await sleep(250); };
  const tap = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(300);
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(shotDir, name), Buffer.from(r.result.data, 'base64'));
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
  const docHash = (idArg) => evaluate(`(async () => {
    const t = await (await fetch('/i/${idArg}/download?locale=es&theme=light')).text();
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') + ':' + t.length;
  })()`);
  const center = (blockId) => evaluate(frameJs(`
    const e = d.querySelector('[data-block-id="${blockId}"]'); e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect(); const f = document.querySelector('iframe').getBoundingClientRect();
    return { x: Math.round(f.left + r.left + r.width / 2), y: Math.round(f.top + r.top + Math.min(r.height / 2, 60)) };`));
  const diffIds = (a, b) => Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]);
  // Ids of the ancestors of a block: their outerHTML contains it, so they change when it does.
  const ancestorsOf = (blockId) => evaluate(frameJs(`const out = []; let e = d.querySelector('[data-block-id="${blockId}"]')?.parentElement?.closest('[data-block-id]'); while (e) { out.push(e.dataset.blockId); e = e.parentElement?.closest('[data-block-id]'); } return out;`));
  const changedBeyond = async (a, b, target) => { const anc = await ancestorsOf(target); return diffIds(a, b).filter((k) => k !== target && !anc.includes(k)); };
  const chartBlockId = () => evaluate(frameJs(`const e = d.querySelector('[data-block-id] > .ig-chart, [data-block-id] .ig-chart-figure, [data-block-id] svg'); return e ? e.closest('[data-block-id]').dataset.blockId : null;`));
  const layerText = () => evaluate(`document.querySelector('[data-block-layer]').innerText`);
  const lastReply = () => evaluate(`(() => { const li = [...document.querySelectorAll('#workspace-chat [role=log] > li')].pop(); return li ? { text: li.innerText, chips: [...li.querySelectorAll('ul button')].map((b) => b.textContent.trim()), hasUndo: [...li.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Deshacer'), pending: !!li.querySelector('[role=status], .spinner') && li.innerText.includes('Trabajando') } : null; })()`);
  const sendChat = async (text) => {
    await evaluate(`document.querySelector('#workspace-chat textarea').focus()`);
    await send('Input.insertText', { text });
    await key('Enter', 'Enter', 13);
  };
  // Settled = the request and its reply are logged, the reply is no longer working, and either it is
  // a refusal or it lists its changed blocks with Undo. The history that records an edit arrives
  // after the action returns, so a reply that changed something is not settled before its chips.
  const waitReply = async (previousCount) => waitFor(async () => {
    const r = await lastReply();
    if (!r || (await logCount()) < previousCount + 2 || r.text.includes('Trabajando')) return null;
    if (r.text.includes(ES.notPossible)) return r;
    return r.chips.length > 0 && r.hasUndo ? r : null;
  }, 'chat reply', 20000);
  const logCount = () => evaluate(`document.querySelectorAll('#workspace-chat [role=log] > li').length`);

  // ============ Scenario A/B/C: /i/pensiones at 1280, light
  await open('/i/pensiones', { width: 1280 });
  const S = 'pensiones-1280';
  const chartId = await chartBlockId();
  check(S, 'a chart block root exists in the iframe DOM with data-block-id', !!chartId, chartId);
  const sandbox = await evaluate(`document.querySelector('iframe').getAttribute('sandbox')`);
  check(S, 'iframe stays sandbox="allow-same-origin" (no allow-scripts)', sandbox === 'allow-same-origin', sandbox);
  check(S, 'no script is injected in the iframe document', await evaluate(frameJs(`return d.querySelectorAll('script').length === 0;`)));

  const before = await blockMap();
  const beforeHash = await docHash('pensiones');
  const otherHashBefore = await docHash('gasto-publico');
  check(S, 'at rest nothing is drawn over the document', (await layerText()).trim() === '', JSON.stringify(await layerText()));

  const at = await center(chartId);
  await mouse('mouseMoved', at.x, at.y);
  await sleep(400);
  const hoverText = await layerText();
  check(S, 'hover shows the type label and the three actions', /Gráfico/.test(hoverText) && (await evaluate(`[...document.querySelectorAll('[data-block-layer] [role=toolbar] button')].map((b) => b.title).join('|')`)) === 'Comentar|Editar con IA|Regenerar', hoverText.replace(/\n/g, ' / '));
  await shot('hover-1280-light.png');

  await click(at.x, at.y);
  await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), 'context chip');
  const chipText = await evaluate(`document.querySelector('#workspace-chat [aria-label="${ES.chip}"]').innerText`);
  check(S, 'click selects: the context chip names the chart', /Gráfico/.test(chipText), chipText);
  check(S, 'selection is announced (aria-live blockSelected)', (await evaluate(`[...document.querySelectorAll('[role=status][aria-live=polite]')].map((e) => e.textContent).join('|')`)).includes('Bloque seleccionado:'));
  check(S, 'selecting moves the focus to the chat input', await evaluate(`document.activeElement === document.querySelector('#workspace-chat textarea')`));
  await shot('selected-1280-light.png');
  const chartName = chipText.split(':').slice(1).join(':').replace(/\s+/g, ' ').trim();

  // ---- A: change the chart (the sample is already a line chart, so first ask for columns, then lines)
  async function localEdit(scenario, instruction, expectedAfterChange) {
    const n = await logCount();
    await sendChat(instruction);
    const sawVeil = await waitFor(() => evaluate(`!!document.querySelector('[data-block-working]')`), 'working veil', 4000).catch(() => false);
    check(scenario, 'only that block shows the working veil while the edit runs', sawVeil === true);
    await waitReply(n);
    const reply = await lastReply();
    const after = await blockMap();
    return { reply, after, changed: diffIds(expectedAfterChange, after), others: await changedBeyond(expectedAfterChange, after, chartId), targetChanged: expectedAfterChange[chartId] !== after[chartId] };
  }

  const A1 = 'A-to-columns';
  const a1 = await localEdit(A1, 'cambia a columnas', before);
  check(A1, 'reply says exactly 1 block was updated', a1.reply.text.includes(ES.changedOne), a1.reply.text.replace(/\n/g, ' / '));
  check(A1, 'reply lists exactly the selected block', a1.reply.chips.length === 1 && a1.reply.chips[0] === chartName, JSON.stringify(a1.reply.chips));
  check(A1, 'the chart block changed and every other root is byte-identical (only its ancestors, which contain it, differ)', a1.targetChanged && a1.others.length === 0, JSON.stringify({ changed: a1.changed, others: a1.others }));
  check(A1, 'the selection survives the edit', await evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`));
  check(A1, 'Undo is offered in the chat reply', a1.reply.hasUndo);
  check(A1, 'Undo is offered in the block toolbar', await evaluate(`!!document.querySelector('[data-block-layer] [data-action=undo]')`));
  const a1Hash = await docHash('pensiones');
  check(A1, 'the stored document changed (download differs)', a1Hash !== beforeHash, `${beforeHash.slice(-8)} -> ${a1Hash.slice(-8)}`);
  check(A1, 'another infographic is untouched', (await docHash('gasto-publico')) === otherHashBefore);
  check(A1, 'the original chart is a line chart and now it is a column chart', before[chartId].includes('ig-chart--line') && a1.after[chartId].includes('ig-chart--column'));
  await shot('edited-1280-light.png');

  const A2 = 'A-to-lines';
  const a2 = await localEdit(A2, 'cambia a gráfico de líneas', a1.after);
  check(A2, 'the chart is a line chart again', a2.after[chartId].includes('ig-chart--line'));
  check(A2, 'reply lists exactly the selected block', a2.reply.chips.length === 1 && a2.reply.chips[0] === chartName, JSON.stringify(a2.reply.chips));
  check(A2, 'the chart block changed and every other root is byte-identical', a2.targetChanged && a2.others.length === 0, JSON.stringify({ changed: a2.changed, others: a2.others }));

  // ---- undo both, the document returns to the exact original
  async function undoLatest() {
    await evaluate(`[...document.querySelectorAll('#workspace-chat [role=log] button')].reverse().find((b) => b.textContent.trim() === '${ES.undo}').click()`);
    await sleep(1200);
  }
  await undoLatest();
  check('A-undo', 'after the first undo the document equals the state before the second edit', diffIds(a1.after, await blockMap()).length === 0);
  await undoLatest();
  const afterUndo = await blockMap();
  check('A-undo', 'after the second undo every block is byte-identical to the original', diffIds(before, afterUndo).length === 0, JSON.stringify(diffIds(before, afterUndo)));
  check('A-undo', 'the stored document is byte-identical to the original (download hash)', (await docHash('pensiones')) === beforeHash);

  // ---- B: a request that cannot be done: no change at all
  const B = 'B-not-possible';
  const nB = await logCount();
  await sendChat('compara con el año anterior');
  await waitReply(nB);
  const rb = await lastReply();
  check(B, 'reply explains it is not possible', rb.text.includes(ES.notPossible), rb.text.replace(/\n/g, ' / '));
  check(B, 'no Undo and no changed-block chips on that reply', !rb.hasUndo && rb.chips.length === 0);
  check(B, 'no block changed', diffIds(before, await blockMap()).length === 0);
  check(B, 'the stored document is untouched (download hash)', (await docHash('pensiones')) === beforeHash);
  const nB2 = await logCount();
  await sendChat('cambia a gráfico de líneas');
  await waitReply(nB2);
  const rb2 = await lastReply();
  check(B, 'asking for a line chart when it already is one is refused, not faked', rb2.text.includes(ES.notPossible) && (await docHash('pensiones')) === beforeHash, rb2.text.replace(/\n/g, ' / '));

  // ---- Esc deselects
  await evaluate(`document.activeElement.blur()`);
  await key('Escape', 'Escape', 27);
  check('esc', 'Esc deselects (context chip gone)', await waitFor(() => evaluate(`!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), 'deselect', 3000).catch(() => false));

  // ---- chip highlight selects + scrolls
  const nG = await logCount();
  await sendChat('Reduce el texto');
  await waitFor(async () => (await logCount()) >= nG + 2, 'the global request and its reply in the log', 5000);
  await waitReply(nG);
  const gl = await lastReply();
  await evaluate(`[...document.querySelectorAll('#workspace-chat [role=log] ul button')].pop().click()`);
  await sleep(600);
  check('chips', 'a changed-block chip selects that block (context chip appears)', await evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), gl.chips.join(','));
  await undoLatest();
  check('chips', 'global edit undone to the original', (await docHash('pensiones')) === beforeHash);

  // ============ Comments + regenerate + keyboard on gasto-publico (keeps pensiones history clean)
  await open('/i/gasto-publico', { width: 1280 });
  const K = 'keyboard';
  await evaluate(`document.querySelector('[data-block-nav]').focus()`);
  await key('ArrowDown', 'ArrowDown', 40);
  await key('ArrowDown', 'ArrowDown', 40);
  const optionActive = await evaluate(`document.getElementById(document.querySelector('[data-block-nav]').getAttribute('aria-activedescendant'))?.textContent`);
  check(K, 'arrow keys move through the block list (outside the iframe)', !!optionActive, optionActive);
  check(K, 'the navigator is reachable by Tab (tabindex=0, listbox, labelled)', await evaluate(`(() => { const n = document.querySelector('[data-block-nav]'); return n.tabIndex === 0 && n.getAttribute('role') === 'listbox' && !!n.getAttribute('aria-label'); })()`));
  check(K, 'the previewed block is outlined in the layer', (await layerText()).trim().length > 0, (await layerText()).replace(/\n/g, ' / '));
  await key('Enter', 'Enter', 13);
  await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`), 'keyboard select');
  check(K, 'Enter selects the block (context chip shown)', true);

  const C = 'comments';
  const selectedBefore = await evaluate(`document.querySelector('#workspace-chat [aria-label="${ES.chip}"]').innerText`);
  const commentsBox = await evaluate(`(() => { const c = document.querySelector('#workspace-chat section[aria-label=Comentario]'); return { count: Number(/^(\\d+)/.exec(c.querySelector('h3').textContent)[1]), empty: c.innerText.includes('Aún no hay comentarios en este bloque.'), items: c.querySelectorAll('li').length }; })()`);
  check(C, 'chat lists the notes of the selected block (empty text when there are none)', commentsBox.count === 0 ? commentsBox.empty && commentsBox.items === 0 : !commentsBox.empty && commentsBox.items === commentsBox.count, JSON.stringify(commentsBox));
  await evaluate(`document.querySelector('[data-action=comment]').click()`);
  await waitFor(() => evaluate(`!!document.querySelector('form[role=dialog] textarea')`), 'comment popover');
  check(C, 'the comment popover opens with the field focused', await evaluate(`document.activeElement === document.querySelector('form[role=dialog] textarea')`));
  await shot('comment-1280-light.png');
  await send('Input.insertText', { text: 'Revisar la fuente de este gráfico' });
  await evaluate(`[...document.querySelectorAll('form[role=dialog] button')].find((b) => b.textContent.trim() === 'Guardar nota').click()`);
  await waitFor(() => evaluate(`!document.querySelector('form[role=dialog]') && !!document.querySelector('[data-block-layer] button[aria-label*="comentarios"]')`), 'badge');
  check(C, 'saving a note shows a numeric badge on the block', /^\d+$/.test(await evaluate(`document.querySelector('[data-block-layer] button[aria-label*="comentarios"]').textContent`)));
  check(C, 'the note is listed in the chat for the selected block', (await evaluate(`document.querySelector('#workspace-chat').innerText`)).includes('Revisar la fuente de este gráfico'));
  await evaluate(`location.reload()`);
  await waitFor(() => evaluate(`!!document.querySelector('[data-block-layer] button[aria-label*="comentarios"]')`), 'badge after reload', 20000);
  check(C, 'notes persist in the mock store across a reload (badge back after reload)', (await evaluate(`Number(document.querySelector('[data-block-layer] button[aria-label*="comentarios"]').textContent)`)) >= commentsBox.count + 1, selectedBefore);

  const R = 'regenerate';
  const hashR = await docHash('gasto-publico');
  const mapR = await blockMap();
  const nR = await logCount();
  await evaluate(`document.querySelector('[data-block-layer] button[aria-label*="comentarios"]').click()`);
  await sleep(500);
  const selectedIdR = await evaluate(`document.querySelector('[data-block-outline=selected]')?.dataset.outlineBlock ?? null`);
  await evaluate(`document.querySelector('[data-action=regenerate]').click()`);
  await waitReply(nR);
  const rr = await lastReply();
  const afterR = await blockMap();
  const targetR = selectedIdR;
  const changedR = await changedBeyond(mapR, afterR, targetR);
  check(R, 'regenerate visibly changes the selected block and nothing else', mapR[targetR] !== afterR[targetR] && changedR.length === 0, JSON.stringify({ target: targetR, others: changedR }));
  check(R, 'reply has Undo and lists that block', rr.hasUndo && rr.chips.length === 1, JSON.stringify(rr.chips));
  await undoLatest();
  check(R, 'undo restores the exact original document', (await docHash('gasto-publico')) === hashR && diffIds(mapR, await blockMap()).length === 0);

  // ============ Comment popover on the footer, the block nearest the bottom edge of the frame
  {
    const F = 'comment-footer-1280';
    await open('/i/pensiones', { width: 1280 });
    const footerId = await evaluate(frameJs(`return d.querySelector('[data-block-id].ig-footer')?.dataset.blockId ?? null;`));
    check(F, 'the infographic has a footer block', !!footerId, String(footerId));
    const fp = await center(footerId);
    await click(fp.x, fp.y);
    await waitFor(() => evaluate(`!!document.querySelector('[data-block-outline=selected] [data-action=comment]')`), 'footer toolbar');
    await evaluate(`document.querySelector('[data-block-outline=selected] [data-action=comment]').click()`);
    await waitFor(() => evaluate(`!!document.querySelector('form[role=dialog] textarea')`), 'footer comment popover');
    const geo = await evaluate(`(() => {
      const layer = document.querySelector('[data-block-layer]').getBoundingClientRect();
      const form = document.querySelector('form[role=dialog]');
      const box = form.getBoundingClientRect();
      const inside = (r) => r.left >= layer.left - 0.5 && r.right <= layer.right + 0.5 && r.top >= layer.top - 0.5 && r.bottom <= layer.bottom + 0.5;
      const parts = [...form.querySelectorAll('textarea, button')].map((e) => e.getBoundingClientRect());
      return { popoverInside: inside(box), partsInside: parts.every(inside), popover: [Math.round(box.top), Math.round(box.bottom)], layer: [Math.round(layer.top), Math.round(layer.bottom)] };
    })()`);
    check(F, 'the comment popover on the footer is fully inside the overlay layer (textarea and buttons visible)', geo.popoverInside && geo.partsInside, JSON.stringify(geo));
    await shot('comment-footer-1280-light.png');
    await key('Escape', 'Escape', 27);
  }

  // ============ Screenshots: 1280 dark, and 360 light/dark with the touch action bar
  await open('/i/pensiones', { width: 1280, scheme: 'dark' });
  const cDark = await center(await chartBlockId());
  await click(cDark.x, cDark.y);
  await sleep(500);
  await shot('selected-1280-dark.png');
  for (const scheme of ['light', 'dark']) {
    const T = `touch-360-${scheme}`;
    await open('/i/pensiones', { width: 360, height: 780, mobile: true, scheme });
    check(T, 'touch layout: no hover toolbar at rest', (await layerText()).trim() === '');
    const cid = await chartBlockId();
    const p = await center(cid);
    await tap(p.x, p.y);
    await waitFor(() => evaluate(`!!document.querySelector('[class*=bar] [role=toolbar]')`), 'bottom action bar', 5000).catch(() => {});
    const bar = await evaluate(`(() => { const t = document.querySelector('[class*=bar] [role=toolbar]'); if (!t) return null; const r = t.parentElement.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, vh: innerHeight, buttons: [...t.querySelectorAll('button')].map((b) => b.textContent.trim()) }; })()`);
    check(T, 'tap selects and shows the bottom action bar', !!bar && Math.abs(bar.bottom - bar.vh) < 2, JSON.stringify(bar));
    check(T, 'the bar offers Comment / Edit with AI / Regenerate', !!bar && ['Comentar', 'Editar con IA', 'Regenerar'].every((x) => bar.buttons.includes(x)));
    check(T, 'selecting by tap does not open the chat or raise the keyboard', await evaluate(`!document.querySelector('#workspace-chat')`));
    check(T, 'no horizontal overflow at 360 px', await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    await shot(`selected-360-${scheme}.png`);
    if (scheme === 'light') {
      await evaluate(`document.querySelector('[data-action=comment]').click()`);
      await waitFor(() => evaluate(`!!document.querySelector('form[role=dialog] textarea')`), 'comment sheet');
      const sheet = await evaluate(`(() => { const r = document.querySelector('form[role=dialog]').getBoundingClientRect(); return { l: r.left, r: r.right, vw: innerWidth, b: r.bottom, vh: innerHeight }; })()`);
      check(T, 'the comment popover is a bottom sheet inside the viewport', sheet.l >= 0 && sheet.r <= sheet.vw && sheet.b <= sheet.vh, JSON.stringify(sheet));
      await shot('comment-360-light.png');
      await key('Escape', 'Escape', 27);
      check(T, 'Esc closes the comment popover first (block stays selected)', await evaluate(`!document.querySelector('form[role=dialog]') && !!document.querySelector('[class*=bar] [role=toolbar]')`));
      await evaluate(`document.querySelector('[data-action=edit]').click()`);
      await waitFor(() => evaluate(`!!document.querySelector('#workspace-chat textarea')`), 'chat sheet');
      check(T, 'Edit with AI opens the chat sheet with the context chip', await evaluate(`!!document.querySelector('#workspace-chat [aria-label="${ES.chip}"]')`));
      await shot('chat-360-light.png');
      await evaluate(`document.querySelector('[aria-label="Cerrar el chat"]').click()`);
      await sleep(300);
    }
  }
} catch (error) {
  check('run', 'script completed without an exception', false, error.stack ?? error.message);
} finally {
  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* Chrome may still hold files; the profile is in tmp */ }
  const failed = checks.filter((c) => !c.ok);
  const stamp = new Date().toISOString();
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify({ stamp, base, total: checks.length, failed: failed.length, notes, checks }, null, 2));
  const lines = [
    '# Block selection and local editing: E2E report', '',
    `Run: ${stamp} against ${base}. ${checks.length - failed.length}/${checks.length} checks passed.`, '',
    'Command: `node scripts/dev/blocks-e2e.mjs` (dev server on :3000, Chrome headless over CDP). Screenshots: `design-system/reports/shots/ui-blocks/`.', '',
    'Note: the sample chart of `pensiones` already is a line chart, so scenario A asks for columns first, then for lines, and undoes both. Scenario B asks for a comparison with the previous year (no data) and for lines on a line chart: both leave the document untouched.', '',
    '| Scenario | Check | Result |', '|---|---|---|',
    ...checks.map((c) => `| ${c.scenario} | ${c.name.replace(/\|/g, '/')} | ${c.ok ? 'PASS' : `FAIL ${c.detail.slice(0, 120).replace(/\|/g, '/')}`} |`),
  ];
  fs.writeFileSync(path.join(reportDir, 'report.md'), lines.join('\n') + '\n');
  console.log(`\n${checks.length - failed.length}/${checks.length} passed -> ${path.relative(root, reportDir)}/report.{json,md}`);
  process.exit(failed.length ? 1 : 0);
}
