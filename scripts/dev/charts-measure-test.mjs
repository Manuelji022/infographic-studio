// Usage: node scripts/dev/charts-measure-test.mjs
import assert from 'node:assert/strict';
import { fits, lineCount, SAFETY, textWidth } from '../../design-system/charts/layout/measure.ts';
import { FALLBACK_EM, GLYPH_WIDTHS, UNCOVERED } from
  '../../design-system/charts/layout/glyph-widths.ts';
import { characters, withFontPage } from './glyph-widths.mjs';

const samples = [
  'Población total', 'Ingresos anuales', 'Gasto público', 'Educación', 'Sanidad',
  'Energía renovable', 'Empleo juvenil', 'Desempleo', 'España', 'Reino Unido',
  'A Coruña', 'Málaga', 'Áreas rurales', 'Índice de producción', 'Año 2026',
  '25,6 %', '1.500 €', '27.4%', '1,234.56', '0,003',
  '-12,5', '100.000', '42', '0', '2020–2026',
  'Annual revenue', 'Market share', 'United Kingdom', 'Renewable energy', 'Net income',
  'Average household spending', 'Research & development', 'Growth by region',
  'Quarterly results', 'Projected demand', '«Otros sectores»', '“Annual outlook”',
  '¿Cómo cambia el empleo?', '¡Más inversión!', 'Niñez y juventud',
  'Pingüino: índice de variación', 'Façade à Paris', 'Dades: ç, à, è, ì, ò, ù',
  'Total · 2026', 'Previsión — escenario central', 'Datos provisionales…',
  'La evolución de la población española durante los últimos veinte años',
  'Changes in household income across regions and between generations',
  '25,6\u202f%', '1.500\u00a0€',
];
const combinations = [
  { family: 'sans', weight: 400, size: 12, name: 'Geist' },
  { family: 'sans', weight: 700, size: 20, name: 'Geist' },
  { family: 'sans', weight: 500, size: 14, name: 'Geist' },
];

async function test() {
  assert.equal(samples.length, 50);
  const measured = await withFontPage(async (evaluate, uncovered) => {
    assert.deepEqual(uncovered, UNCOVERED, 'Regenerate metrics after changing fonts');
    return evaluate(`(() => {
      const span = document.createElement('span');
      span.style.whiteSpace = 'pre';
      document.body.append(span);
      return ${JSON.stringify(combinations)}.map((font) => {
        span.style.font = font.weight + ' ' + font.size + 'px "' + font.name + '"';
        return ${JSON.stringify(samples)}.map((text) => {
          span.textContent = text;
          return span.getBoundingClientRect().width;
        });
      });
    })()`);
  });
  const rows = [];
  const failures = [];
  for (const [index, font] of combinations.entries()) {
    let maxUnder = 0;
    let maxOver = 0;
    let minMargin = Infinity;
    let worstUnder = '';
    let worstOver = '';
    for (const [sampleIndex, text] of samples.entries()) {
      const actual = measured[index][sampleIndex];
      const safe = textWidth(text, font);
      const estimate = safe / SAFETY;
      const under = Math.max(0, (actual - estimate) / actual);
      const over = Math.max(0, (estimate - actual) / actual);
      if (under > maxUnder) { maxUnder = under; worstUnder = text; }
      if (over > maxOver) { maxOver = over; worstOver = text; }
      minMargin = Math.min(minMargin, (safe - actual) / actual);
      // Allow at most 3% underestimation, 8% overestimation, and no shortfall with SAFETY.
      if (under > 0.03 || over > 0.08 || safe < actual) {
        failures.push({ font, text, actual, safe, under, over });
      }
    }
    rows.push({
      font: `${font.family} ${font.weight} ${font.size}px`, samples: samples.length,
      'max under': `${(maxUnder * 100).toFixed(4)}%`, worstUnder,
      'max over': `${(maxOver * 100).toFixed(4)}%`, worstOver,
      'min safety margin': `${(minMargin * 100).toFixed(4)}%`,
    });
  }
  console.table(rows);
  assert.deepEqual(failures, [], 'Width accuracy or safety margin failed');

  const font = { family: 'sans', weight: 400, size: 12 };
  const wordWidth = textWidth('word', font);
  assert.equal(textWidth('', font), 0);
  assert.equal(lineCount('', 0, font), 0);
  assert.equal(fits('', { width: 0, height: 0 }, font, 16), true);
  assert.equal(lineCount('word', wordWidth - 0.01, font), Infinity);
  assert.equal(lineCount('word', wordWidth, font), 1);
  assert.equal(fits('word', { width: wordWidth - 0.01, height: 100 }, font, 16), false);
  assert.equal(lineCount('word word', wordWidth, font), 2);
  assert.equal(lineCount('  word   word  ', wordWidth, font), 2);
  assert.equal(lineCount('   ', 0, font), 1);
  assert.equal(lineCount('word\nword', wordWidth, font), 2);
  assert.equal(lineCount('word\r\nword', wordWidth, font), 2);
  assert.equal(lineCount('word\u00a0word', wordWidth, font), Infinity);
  assert.equal(lineCount('word\u202fword', wordWidth, font), Infinity);
  assert.equal(fits('word word', { width: wordWidth, height: 32 }, font, 16), true);
  assert.equal(fits('word word', { width: wordWidth, height: 31 }, font, 16), false);
  assert.equal(fits('word', { width: wordWidth, height: 15 }, font, 16), false);
  assert.ok(Math.abs(textWidth('ab', { ...font, letterSpacing: 2 }) -
    textWidth('ab', font) - 2 * SAFETY) < 1e-10);
  assert.equal(textWidth('a', { ...font, letterSpacing: 2 }), textWidth('a', font));
  for (const [key, widths] of Object.entries(GLYPH_WIDTHS)) {
    const [family, weight] = key.split('-');
    const selected = { family, weight: Number(weight), size: 10 };
    assert.equal(textWidth('🦉', selected), FALLBACK_EM[key] * 10 * SAFETY);
    for (const char of characters) {
      if (UNCOVERED[key].includes(char)) {
        assert.equal(Object.hasOwn(widths, char), false);
        assert.equal(textWidth(char, selected), FALLBACK_EM[key] * 10 * SAFETY);
      } else {
        assert.ok(Object.hasOwn(widths, char), `Missing covered character: ${key} ${char}`);
      }
    }
  }
  console.log('PASS: 150 HTML comparisons; wrapping, fits, spacing and fallback edge cases.');
  console.log('UNCOVERED:', JSON.stringify(UNCOVERED));
}

test().catch((error) => { console.error(error); process.exitCode = 1; });
