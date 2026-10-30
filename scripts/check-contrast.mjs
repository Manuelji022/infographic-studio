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
];

/** Convert an sRGB channel to its WCAG relative-luminance linear value. */
function linearize(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Convert a hex color to RGB channels, ignoring alpha when supplied. */
function parseHexColor(color) {
  if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)) {
    throw new Error(`invalid color value ${JSON.stringify(color)}`);
  }
  const hex = color.slice(1, 7);
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

/** Calculate WCAG 2.x relative luminance for a hex sRGB color. */
function relativeLuminance(color) {
  const [red, green, blue] = parseHexColor(color).map(linearize);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

/** Calculate the WCAG contrast ratio between two hex sRGB colors. */
function contrastRatio(firstColor, secondColor) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function tokenColor(values, theme, token) {
  const color = values[`themes.${theme}.${token}`];
  if (typeof color !== 'string') {
    throw new Error(`themes.${theme}.${token}: expected a resolved hex color`);
  }
  return color;
}

function evaluateTheme(values, theme) {
  return contrastPairs.map((pair) => {
    const foreground = tokenColor(values, theme, pair.foreground);
    const background = tokenColor(values, theme, pair.background);
    const ratio = contrastRatio(foreground, background);
    return {
      ...pair,
      ratio,
      passed: ratio >= pair.minRatio,
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
    const result = row.passed ? 'PASS' : '**FAIL**';
    table.push(
      `| ${row.id} | ${row.kind} | ${row.foreground} | ${row.background} `
        + `| ${formatRatio(row.ratio)}:1 | ${row.minRatio.toFixed(1)}:1 | ${result} |`,
    );
  }
  return table.join('\n');
}

function reportContents(results) {
  const allRows = Object.values(results).flat();
  const passed = allRows.filter((row) => row.passed).length;
  const failed = allRows.length - passed;
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
      const result = row.passed ? 'PASS' : 'FAIL';
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
  const allRows = Object.values(results).flat();
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContents(results));
  printTable(results);
  if (allRows.some((row) => !row.passed)) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`check-contrast: ${message.replaceAll('\n', ' ')}`);
  process.exitCode = 1;
}
