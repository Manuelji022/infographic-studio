import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { composeDocument, CSP_STANDALONE } from "../../design-system/infographic/document.ts";
import { getInfographicCss } from "../../design-system/infographic/render.ts";
import { groups, renderTreemapSpike } from "../../design-system/charts/spike/treemap.ts";

const out = path.resolve("design-system/reports/charts-spike/treemap");
mkdirSync(out, { recursive: true });
const extra = readFileSync("design-system/charts/spike/treemap.css", "utf8");
const primitives = readFileSync("design-system/tokens/build/tokens.css", "utf8");
const themes = readFileSync("design-system/tokens/build/themes.css", "utf8");

function declarations(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)]
    .map((match) => [match[1], match[2].trim()]));
}

function resolve(value: string, tokens: Record<string, string>): string {
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (!ref) return value;
  if (!tokens[ref[1]]) throw new Error(`Missing token ${ref[1]}`);
  return resolve(tokens[ref[1]], tokens);
}

function luminance(hex: string): number {
  const rgb = hex.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16) / 255)
    .map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

console.log("| Grupo | Tema | Relleno | Texto | Ratio |\n| --- | --- | --- | --- | --- |");
for (const theme of ["light", "dark"] as const) {
  const themeBlock = themes.split(`[data-ds-theme="${theme}"] {`)[1].split("}")[0];
  const tokens = { ...declarations(primitives), ...declarations(themeBlock) };
  for (const group of groups) {
    const selector = `${theme === "dark" ? '[data-ds-theme="dark"] ' : ""}.tm-${group.id}`;
    const rule = extra.split(`${selector} {`)[1]?.split("}")[0];
    const textToken = rule?.match(/color:\s*(var\([^)]+\))/)?.[1];
    if (!textToken) throw new Error(`Missing text color for ${selector}`);
    const fills = group.id === "social"
      ? [group.color, "var(--ds-color-yellow-pale)"] : [group.color];
    for (const fill of fills) {
      const bg = resolve(fill, tokens);
      const fg = resolve(textToken, tokens);
      const a = luminance(bg), b = luminance(fg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 4.5) throw new Error(`Insufficient contrast: ${group.es} ${theme}`);
      console.log(`| ${group.es} | ${theme} | ${bg} | ${fg} | ${ratio.toFixed(2)}:1 |`);
    }
  }
}

for (const [locale, theme] of [["es", "light"], ["es", "dark"], ["en", "light"]] as const) {
  const html = composeDocument(renderTreemapSpike([], locale), {
    locale, theme, css: getInfographicCss({ dsVersion: "1.0.0", embed: false }) + extra,
    csp: CSP_STANDALONE,
  });
  const file = path.join(out, `${locale}-${theme}.html`);
  writeFileSync(file, html);
  console.log(`Generated ${file}`);
}
