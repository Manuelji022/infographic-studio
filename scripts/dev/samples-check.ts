import { COMPONENTS } from "../../design-system/infographic/manifest.ts";
import { INFOGRAPHIC_SAMPLES } from "../../design-system/infographic/samples.ts";
import { validateFragment } from "../../design-system/infographic/validate.ts";

let failed = false;
const check = (name: string, ok: boolean, details = ""): void => {
  console.log(`${ok ? "OK" : "FAIL"} ${name}${details ? `: ${details}` : ""}`);
  if (!ok) failed = true;
};

check("12 samples", INFOGRAPHIC_SAMPLES.length === 12);
check("unique ids", new Set(INFOGRAPHIC_SAMPLES.map(({ id }) => id)).size === 12);
check("component order", INFOGRAPHIC_SAMPLES.map(({ id }) => id).join(",") ===
  COMPONENTS.map(({ name }) => name).join(","));

for (const sample of INFOGRAPHIC_SAMPLES) {
  const spec = COMPONENTS.find(({ name }) => name === sample.id);
  for (const locale of ["es", "en"] as const) {
    const html = sample.html[locale];
    const result = validateFragment(html);
    check(`${sample.id} ${locale} validates`, result.ok,
      result.ok ? "" : JSON.stringify(result.issues));
    check(`${sample.id} ${locale} root`, html.includes(`class="${sample.id}`));
    check(`${sample.id} ${locale} variants`, Boolean(spec?.variants.every((variant) =>
      html.includes(variant))));
  }
  const classes = (html: string): string[] =>
    [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
  const numbers = (html: string): string[] =>
    [...html.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => match[0].replace(",", "."));
  check(`${sample.id} locale classes`,
    JSON.stringify(classes(sample.html.es)) === JSON.stringify(classes(sample.html.en)));
  check(`${sample.id} locale numbers`,
    JSON.stringify(numbers(sample.html.es)) === JSON.stringify(numbers(sample.html.en)));
}

if (failed) process.exitCode = 1;
