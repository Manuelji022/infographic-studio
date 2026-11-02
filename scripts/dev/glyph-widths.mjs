// Usage: node scripts/dev/glyph-widths.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const characters = [...new Set([
  ...Array.from({ length: 95 }, (_, i) => String.fromCodePoint(32 + i)),
  ...'áéíóúüñÁÉÍÓÚÜÑçÇàèìòù¿¡«»€%‰·–—…’“”\u00a0\u202f',
])];
export const fonts = [
  { family: 'sans', name: 'Geist', weights: [400, 500, 600, 700],
    file: 'geist-latin-wght.woff2' },
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withFontPage(run) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'glyph-widths-'));
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, '--no-first-run', 'about:blank',
  ], { stdio: 'ignore' });
  let ws;
  try {
    let page;
    for (let i = 0; i < 60 && !page; i++) {
      try {
        const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8')
          .split('\n')[0];
        const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        page = tabs.find((tab) => tab.type === 'page');
      } catch { /* Chrome is starting. */ }
      if (!page) await sleep(250);
    }
    if (!page) throw new Error('Chrome did not start');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (!pending.has(message.id)) return;
      const { resolve, reject, timeout } = pending.get(message.id);
      clearTimeout(timeout);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const n = ++id;
      const timeout = setTimeout(() => {
        pending.delete(n);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      pending.set(n, { resolve, reject, timeout });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    const evaluate = async (expression) => {
      const response = await send('Runtime.evaluate', {
        expression, awaitPromise: true, returnByValue: true,
      });
      if (response.exceptionDetails) {
        throw new Error(JSON.stringify(response.exceptionDetails));
      }
      return response.result.value;
    };
    const faces = fonts.map((font) => {
      const data = fs.readFileSync(path.join(root, 'design-system/fonts', font.file));
      return `@font-face { font-family: "${font.name}"; font-weight: 100 900; ` +
        `src: url(data:font/woff2;base64,${data.toString('base64')}) format("woff2"); }`;
    }).join('\n');
    await evaluate(`(async () => {
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(faces)};
      document.head.append(style);
      const fonts = ${JSON.stringify(fonts)};
      for (const font of fonts) {
        for (const weight of font.weights) {
          const query = weight + ' 1000px "' + font.name + '"';
          const loaded = await document.fonts.load(query);
          if (loaded.length !== 1 || loaded[0].status !== 'loaded') {
            throw new Error('Font failed to load: ' + query);
          }
          const span = document.createElement('span');
          span.style.font = query;
          span.style.whiteSpace = 'pre';
          span.id = font.family + '-' + weight;
          span.textContent = ${JSON.stringify(characters.join(''))};
          document.body.append(span);
        }
      }
      await document.fonts.ready;
    })()`);
    await send('DOM.enable');
    await send('CSS.enable');
    const { root: documentNode } = await send('DOM.getDocument');
    const uncovered = {};
    const required = new Set([
      ...characters.slice(0, 95), ...'áéíóúüñÁÉÍÓÚÜÑçÇàèìòù',
    ]);
    for (const font of fonts) {
      for (const weight of font.weights) {
        const key = `${font.family}-${weight}`;
        uncovered[key] = [];
        const { nodeId } = await send('DOM.querySelector', {
          nodeId: documentNode.nodeId, selector: `#${key}`,
        });
        for (const char of characters) {
          await evaluate(`(() => {
            const span = document.getElementById(${JSON.stringify(key)});
            span.textContent = ${JSON.stringify('a' + char + 'a')};
            return span.getBoundingClientRect().width;
          })()`);
          const actual = await send('CSS.getPlatformFontsForNode', { nodeId });
          const covered = actual.fonts.length === 1 && actual.fonts[0].isCustomFont &&
            actual.fonts[0].familyName === font.name;
          if (covered) continue;
          if (required.has(char)) {
            throw new Error(`Required glyph ${JSON.stringify(char)} missing in ${key}: ` +
              JSON.stringify(actual.fonts));
          }
          uncovered[key].push(char);
        }
      }
    }
    return await run(evaluate, uncovered);
  } finally {
    ws?.close();
    proc.kill();
    await sleep(400);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
}

async function generate() {
  const { widths, uncovered } = await withFontPage(async (evaluate, uncovered) => ({
    uncovered,
    widths: await evaluate(`(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fontKerning = 'none';
    const widths = {};
    for (const font of ${JSON.stringify(fonts)}) {
      for (const weight of font.weights) {
        ctx.font = weight + ' 1000px "' + font.name + '"';
        widths[font.family + '-' + weight] = Object.fromEntries(
          ${JSON.stringify(characters)}
            .filter((char) => !${JSON.stringify(uncovered)}
              [font.family + '-' + weight].includes(char)).map((char) => [
            char, Number((ctx.measureText(char).width / 1000).toFixed(4)),
          ]),
        );
      }
    }
    return widths;
  })()`),
  }));
  const fallback = Object.fromEntries(Object.entries(widths).map(([key, values]) => [
    key, Number((Array.from('abcdefghijklmnopqrstuvwxyz')
      .reduce((sum, char) => sum + values[char], 0) / 26).toFixed(4)),
  ]));
  const output = '// GENERADO por scripts/dev/glyph-widths.mjs; no editar\n' +
    `export const GLYPH_WIDTHS = ${JSON.stringify(widths, null, 2)} as const;\n\n` +
    `export const FALLBACK_EM = ${JSON.stringify(fallback, null, 2)} as const;\n\n` +
    'export type FontKey = keyof typeof GLYPH_WIDTHS;\n\n' +
    'export const UNCOVERED: Record<FontKey, readonly string[]> = ' +
    `${JSON.stringify(uncovered, null, 2)};\n`;
  fs.writeFileSync(path.join(root, 'design-system/charts/layout/glyph-widths.ts'), output);
  console.log(`Generated ${Object.keys(widths).length} fonts × ${characters.length} glyphs.`);
  console.table(fallback);
  console.log('UNCOVERED:', JSON.stringify(uncovered));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate().catch((error) => { console.error(error); process.exitCode = 1; });
}
