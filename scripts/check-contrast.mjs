import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokenFiles, resolveTokens } from './lib/tokens.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '..');
const reportPath = path.join(repositoryDirectory, 'design-system/reports/contrast.md');

const contrastPairs = [
  {
    id: 'text-on-canvas',
    foreground: 'text',
    background: 'canvas',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Primary text on page background.',
  },
  {
    id: 'text-on-surface',
    foreground: 'text',
    background: 'surface',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Primary text on raised surface.',
  },
  {
    id: 'text-on-surface-feature',
    foreground: 'text',
    background: 'surface-feature',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Primary text on featured surface.',
  },
  {
    id: 'text-on-surface-deep',
    foreground: 'text',
    background: 'surface-deep',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Primary text on deep surface.',
  },
  {
    id: 'text-muted-on-canvas',
    foreground: 'text-muted',
    background: 'canvas',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Muted text on page background.',
  },
  {
    id: 'text-muted-on-surface',
    foreground: 'text-muted',
    background: 'surface',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Muted text on raised surface.',
  },
  {
    id: 'text-muted-on-surface-feature',
    foreground: 'text-muted',
    background: 'surface-feature',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Muted text on featured surface.',
  },
  {
    id: 'text-muted-on-surface-deep',
    foreground: 'text-muted',
    background: 'surface-deep',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Muted text on deep surface.',
  },
  {
    id: 'text-inverse-on-surface-inverse',
    foreground: 'text-inverse',
    background: 'surface-inverse',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Inverse text on inverse surface.',
  },
  {
    id: 'on-accent-on-accent',
    foreground: 'on-accent',
    background: 'accent',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Action label on accent fill.',
  },
  {
    id: 'on-accent-on-accent-hover',
    foreground: 'on-accent',
    background: 'accent-hover',
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Action label on hovered accent fill.',
  },
  {
    id: 'border-strong-on-canvas',
    foreground: 'border-strong',
    background: 'canvas',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Strong control border on page background.',
  },
  {
    id: 'border-strong-on-surface',
    foreground: 'border-strong',
    background: 'surface',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Strong control border on raised surface.',
  },
  {
    id: 'focus-ring-on-canvas',
    foreground: 'focus-ring',
    background: 'canvas',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Focus indicator on page background.',
  },
  {
    id: 'focus-ring-on-surface',
    foreground: 'focus-ring',
    background: 'surface',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Focus indicator on raised surface.',
  },
  {
    id: 'focus-ring-on-surface-deep',
    foreground: 'focus-ring',
    background: 'surface-deep',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Focus indicator on deep surface.',
  },
  ...['canvas', 'surface'].map((background) => ({
    id: `danger-text-on-${background}`,
    foreground: 'danger-text',
    background,
    minRatio: 4.5,
    kind: 'TEXT',
    note: `Error message text on ${background}.`,
  })),
  ...['canvas', 'surface'].map((background) => ({
    id: `danger-on-${background}`,
    foreground: 'danger',
    background,
    minRatio: 3,
    kind: 'NON-TEXT',
    note: `Danger signal (borders, icons) on ${background}.`,
  })),
  ...Array.from({ length: 6 }, (_, index) => {
    const dataToken = `data.${index + 1}`;
    return [
      {
        id: `data-${index + 1}-on-canvas`,
        foreground: dataToken,
        background: 'canvas',
        minRatio: 3,
        kind: 'NON-TEXT',
        note: `Data color ${index + 1} on page background.`,
      },
      {
        id: `data-${index + 1}-on-surface`,
        foreground: dataToken,
        background: 'surface',
        minRatio: 3,
        kind: 'NON-TEXT',
        note: `Data color ${index + 1} on raised surface.`,
      },
    ];
  }).flat(),
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `on-data-${index + 1}-on-data-${index + 1}`,
    foreground: `on-data.${index + 1}`,
    background: `data.${index + 1}`,
    minRatio: 4.5,
    kind: 'TEXT',
    note: `Chart label ${index + 1} on its data color.`,
  })),
  ...[
    ['chart-on-highlight', 'chart.on-highlight', 'chart.highlight'],
    ['chart-on-highlight-soft', 'chart.on-highlight', 'chart.highlight-soft'],
    ['chart-on-negative', 'chart.on-negative', 'chart.negative'],
  ].map(([id, foreground, background]) => ({
    id,
    foreground,
    background,
    minRatio: 4.5,
    kind: 'TEXT',
    note: 'Chart emphasis label on its fill.',
  })),
  {
    id: 'chart-negative-on-surface',
    foreground: 'chart.negative',
    background: 'surface',
    minRatio: 3,
    kind: 'NON-TEXT',
    note: 'Chart negative signal on surface.',
  },
];

const exceptions = {
  light: {
    'on-data-6-on-data-6':
      'Never place text on data-6 in light theme; place its label outside or on --ds-surface.',
  },
};

/** Convert an sRGB channel to its WCAG relative-luminance linear value. */
function linearize(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Parse sRGB hex (including alpha) or the achromatic OKLCH Paper surfaces. */
function parseColor(color) {
  const neutral = /^oklch\(([\d.]+)% 0 0\)$/.exec(color);
  if (neutral) {
    const linear = (Number(neutral[1]) / 100) ** 3;
    const channel = 255 * (linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055);
    return [channel, channel, channel, 1];
  }
  if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)) {
    throw new Error(`invalid color value ${JSON.stringify(color)}`);
  }
  return [...[1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)),
    color.length === 9 ? Number.parseInt(color.slice(7), 16) / 255 : 1];
}

function composite(color, background) {
  return color.slice(0, 3).map((channel, index) => channel * color[3] + background[index] * (1 - color[3]));
}

function relativeLuminance(color) {
  const [red, green, blue] = color.map(linearize);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(firstColor, secondColor, page) {
  const background = composite(parseColor(secondColor), parseColor(page));
  const foreground = composite(parseColor(firstColor), background);
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function tokenColor(values, theme, token, style = 'studio') {
  const prefix = style === 'studio' ? `themes.${theme}` : `styles.paper.${theme}.roles`;
  const color = values[`${prefix}.${token}`];
  if (typeof color !== 'string') {
    throw new Error(`themes.${theme}.${token}: expected a resolved hex color`);
  }
  return color;
}

function evaluateTheme(values, theme, style = 'studio') {
  return contrastPairs.map((pair) => {
    const foreground = tokenColor(values, theme, pair.foreground, style);
    const background = tokenColor(values, theme, pair.background, style);
    const ratio = contrastRatio(foreground, background, tokenColor(values, theme, 'surface', style));
    return {
      ...pair,
      ratio,
      passed: ratio >= pair.minRatio,
      exception: exceptions[theme]?.[pair.id],
    };
  });
}

function formatRatio(ratio) {
  return ratio.toFixed(2);
}

function markdownTable(rows) {
  const table = [
    '| Pair | Kind | Foreground | Background | Ratio | Required | Result |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
  ];
  for (const row of rows) {
    const result = row.exception ? `EXCEPCIÓN — ${row.exception}`
      : row.passed ? 'PASS' : '**FAIL**';
    table.push(
      `| ${row.id} | ${row.kind} | ${row.foreground} | ${row.background} `
        + `| ${formatRatio(row.ratio)}:1 | ${row.minRatio.toFixed(1)}:1 | ${result} |`,
    );
  }
  return table.join('\n');
}

function reportContents(results) {
  const allRows = Object.values(results).flat();
  const passed = allRows.filter((row) => row.passed && !row.exception).length;
  const failed = allRows.filter((row) => !row.passed && !row.exception).length;
  const excepted = allRows.filter((row) => row.exception).length;
  const sections = [
    '# WCAG Contrast Report',
    '',
    'GENERATED by scripts/check-contrast.mjs, do not edit',
    '',
  ];

  for (const theme of ['light', 'dark']) {
    sections.push(`## ${theme[0].toUpperCase()}${theme.slice(1)} theme`, '');
    sections.push(markdownTable(results[theme]), '');
  }

  sections.push(
    '## Summary',
    '',
    `- Pairs evaluated: ${allRows.length}`,
    `- PASS: ${passed}`,
    `- FAIL: ${failed}`,
    `- EXCEPCIÓN: ${excepted}`,
    '',
    '## Not tested, and why',
    '',
    '- The decorative `border` token is not tested; it is not a control boundary.',
    '- Accent against canvas is not tested: a button is identified by its text label,',
    '  whose foreground/background contrast is tested using `on-accent` on `accent`',
    '  and `accent-hover`.',
    '',
  );
  return sections.join('\n');
}

function printTable(results) {
  console.log('Theme | Pair | Ratio | Required | Result');
  for (const theme of ['light', 'dark']) {
    for (const row of results[theme]) {
      const result = row.exception ? `EXCEPCIÓN (${row.ratio.toFixed(2)}:1)`
        : row.passed ? 'PASS' : 'FAIL';
      console.log(
        `${theme} | ${row.id} | ${formatRatio(row.ratio)}:1 `
          + `| ${row.minRatio.toFixed(1)}:1 | ${result}`,
      );
    }
  }
}

function main() {
  const { values } = resolveTokens(loadTokenFiles());
  const results = {
    light: evaluateTheme(values, 'light'),
    dark: evaluateTheme(values, 'dark'),
  };
  const paper = { light: evaluateTheme(values, 'light', 'paper'), dark: evaluateTheme(values, 'dark', 'paper') };
  const allRows = [...Object.values(results).flat(), ...Object.values(paper).flat()];
  const paperReport = ['## Paper', '', 'Alpha backgrounds are composited over Paper page; alpha foregrounds over the resulting background.', '',
    ...['light', 'dark'].flatMap((theme) => [`### Paper ${theme}`, '', markdownTable(paper[theme]), ''])].join('\n');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContents(results) + paperReport);
  console.log('Studio');
  printTable(results);
  console.log('Paper');
  printTable(paper);
  if (allRows.some((row) => !row.passed && !row.exception)) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`check-contrast: ${message.replaceAll('\n', ' ')}`);
  process.exitCode = 1;
}
