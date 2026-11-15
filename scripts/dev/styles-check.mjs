// End-to-end token cascade check. Uses local static files and Chrome CDP; no server.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'styles-check-'));
const reportPath = path.join(repository, 'design-system/reports/styles-check.json');
const port = 9800 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const variables = ['surface', 'text', 'accent', 'control', 'type-body-family', 'type-ui-size'];
const serif = '"Source Serif 4", ui-serif, Georgia, serif';
const sans = 'Geist, system-ui, sans-serif';
const expected = {
  'studio-light': ['#faf9f5', '#141413', '#d97757', '#faf9f5', serif, '16px'],
  'studio-dark': ['#1f1f1d', '#faf9f5', '#d97757', '#1f1f1d', serif, '16px'],
  'paper-light': ['#FFFFFF', '#000000DF', '#0D74CE', '#0000000F', sans, '15px'],
  'paper-dark': ['#111111', '#FFFFFFED', '#0D74CE', '#FFFFFF12', sans, '15px'],
};
const cases = [
  { name: 'html default', expected: 'studio-light' },
  { name: 'html auto without style under emulated light', theme: 'auto', scheme: 'light', expected: 'studio-light', colorScheme: 'light' },
  { name: 'html auto without style under emulated dark', theme: 'auto', scheme: 'dark', expected: 'studio-dark', colorScheme: 'dark' },
  { name: 'paper dark / child auto under emulated light', style: 'paper', theme: 'dark', target: 'auto', scheme: 'light', expected: 'paper-light', colorScheme: 'light' },
  { name: 'studio dark / child auto under emulated light', style: 'studio', theme: 'dark', target: 'auto', scheme: 'light', expected: 'studio-light', colorScheme: 'light' },
  { name: 'studio / nested paper light / child paper dark', style: 'studio', theme: 'light', target: 'nested-paper-dark', expected: 'paper-dark' },
  { name: 'html paper light', style: 'paper', theme: 'light', expected: 'paper-light' },
  { name: 'html paper dark', style: 'paper', theme: 'dark', expected: 'paper-dark' },
  { name: 'paper html / child dark theme', style: 'paper', theme: 'light', target: 'dark', expected: 'paper-dark' },
  { name: 'paper html / child studio dark', style: 'paper', theme: 'light', target: 'studio-dark', expected: 'studio-dark' },
  { name: 'studio html / child paper light', style: 'studio', theme: 'dark', target: 'paper-light', expected: 'paper-light' },
  { name: 'paper auto under emulated dark', style: 'paper', theme: 'auto', scheme: 'dark', expected: 'paper-dark' },
  { name: 'paper html / child auto under emulated dark', style: 'paper', theme: 'light', target: 'auto', scheme: 'dark', expected: 'paper-dark', colorScheme: 'dark' },
  { name: 'paper dark / child studio light', style: 'paper', theme: 'dark', target: 'studio-light', expected: 'studio-light' },
  { name: 'paper dark / child studio auto under emulated light', style: 'paper', theme: 'dark', target: 'studio-auto', expected: 'studio-light' },
  { name: 'studio dark / child paper auto under emulated light', style: 'studio', theme: 'dark', target: 'paper-auto', expected: 'paper-light' },
  { name: 'paper dark / child paper light', style: 'paper', theme: 'dark', target: 'paper-light', expected: 'paper-light' },
  { name: 'studio html auto under emulated dark', style: 'studio', theme: 'auto', scheme: 'dark', expected: 'studio-dark' },
];
for (const file of ['tokens.css', 'themes.css', 'styles.css']) {
  fs.copyFileSync(path.join(repository, 'design-system/tokens/build', file), path.join(temporary, file));
}
const fixture = `<!doctype html><html><head><meta charset="utf-8">
${['tokens', 'themes', 'styles'].map((file) => `<link rel="stylesheet" href="${file}.css">`).join('\n')}
</head><body>
<section id="dark" data-ds-theme="dark"></section>
<section id="auto" data-ds-theme="auto"></section>
${['studio', 'paper'].flatMap((style) => ['light', 'dark', 'auto'].map((theme) =>
  `<section id="${style}-${theme}" data-ds-style="${style}" data-ds-theme="${theme}"></section>`)).join('\n')}
<section data-ds-style="paper" data-ds-theme="light">
  <section id="nested-paper-dark" data-ds-style="paper" data-ds-theme="dark"></section>
</section>
</body></html>`;
fs.writeFileSync(path.join(temporary, 'index.html'), fixture);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(temporary, 'profile')}`, 'about:blank',
], { stdio: 'ignore' });
let socket;
const results = [];
try {
  let endpoint;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      endpoint = pages.find((page) => page.type === 'page')?.webSocketDebuggerUrl;
      if (endpoint) break;
    } catch { /* Chrome is starting. */ }
    await sleep(250);
  }
  if (!endpoint) throw new Error('Chrome did not start');
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (request) {
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const number = ++id;
    const timeout = setTimeout(() => { pending.delete(number); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(number, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: number, method, params }));
  });
  await send('Page.enable');
  await send('Page.navigate', { url: pathToFileURL(path.join(temporary, 'index.html')).href });
  let loaded = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await send('Runtime.evaluate', { expression: 'document.readyState === "complete" && document.styleSheets.length === 3', returnByValue: true });
    if (result.result.value) { loaded = true; break; }
    await sleep(100);
  }
  if (!loaded) throw new Error('Static fixture stylesheets did not load');
  for (const test of cases) {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: test.scheme ?? 'light' }] });
    const response = await send('Runtime.evaluate', {
      expression: `(() => {
        const test = ${JSON.stringify(test)};
        const html = document.documentElement;
        for (const [attribute, value] of [['data-ds-style', test.style], ['data-ds-theme', test.theme]]) {
          if (value) html.setAttribute(attribute, value); else html.removeAttribute(attribute);
        }
        const target = test.target ? document.getElementById(test.target) : html;
        const computed = getComputedStyle(target);
        return {
          values: ${JSON.stringify(variables)}.map((name) => computed.getPropertyValue('--ds-' + name).trim()),
          colorScheme: computed.colorScheme,
        };
      })()`, returnByValue: true,
    });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    const { values: actual, colorScheme } = response.result.value;
    const wanted = expected[test.expected];
    const passed = actual.every((value, index) => value === wanted[index])
      && (!test.colorScheme || colorScheme === test.colorScheme);
    results.push({ ...test, passed, actualColorScheme: colorScheme, actual: Object.fromEntries(variables.map((name, index) => [`--ds-${name}`, actual[index]])),
      expected: Object.fromEntries(variables.map((name, index) => [`--ds-${name}`, wanted[index]])) });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${test.name}`);
    if (!passed) console.log(JSON.stringify(results.at(-1), null, 2));
  }
  if (results.some((result) => !result.passed)) process.exitCode = 1;
} catch (error) {
  results.push({ passed: false, error: error.message });
  console.error(`styles-check: ${error.message}`);
  process.exitCode = 1;
} finally {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ passed: results.length === cases.length && results.every((result) => result.passed), cases: results }, null, 2) + '\n');
  socket?.close();
  chrome.kill();
  await sleep(400);
  fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
