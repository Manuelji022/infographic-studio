import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CSP_IFRAME,
  CSP_STANDALONE,
  composeDocument,
  type DocumentLocale,
  type DocumentTheme,
} from "./document.ts";

export type { DocumentLocale, DocumentTheme };

export type BuildDocumentOptions = {
  locale: DocumentLocale;
  theme: DocumentTheme;
  dsVersion: string;
  embed: boolean;
  title?: string;
  fontBaseUrl?: string;
};

const SUPPORTED_DS_VERSIONS: readonly string[] = ["1.0.0"];
const cssCache = new Map<string, string>();

function checkVersion(dsVersion: string): void {
  if (!SUPPORTED_DS_VERSIONS.includes(dsVersion)) {
    throw new Error(`Unsupported design system version: ${dsVersion}`);
  }
}

function checkFontBaseUrl(fontBaseUrl: string | undefined): void {
  // fontBaseUrl lands inside CSS url(): only plain path/URL characters are accepted.
  if (fontBaseUrl !== undefined && !/^[A-Za-z0-9/._:-]*$/.test(fontBaseUrl)) {
    throw new Error("Unsupported fontBaseUrl");
  }
}

function loadCss(embed: boolean, fontBaseUrl: string | undefined): string {
  const key = JSON.stringify([embed, fontBaseUrl]);
  // In development, always re-read: regenerated tokens must show up without a server restart.
  const cached = process.env.NODE_ENV === "production" ? cssCache.get(key) : undefined;
  if (cached !== undefined) return cached;

  const root = path.join(process.cwd(), "design-system");
  const infographic = path.join(root, "infographic");
  const read = (file: string) => readFileSync(path.join(root, file), "utf8");
  const components = read("infographic/components.css").replace(
    /@import\s+(["'])(.*?)\1\s*;/g,
    (_match, _quote: string, specifier: string) => {
      if (!specifier.startsWith("./css/") || specifier.includes("..")) {
        throw new Error(`Unsupported infographic CSS import: ${specifier}`);
      }
      return readFileSync(path.join(infographic, specifier), "utf8");
    },
  );
  // Chart styles: charts.css imports one file per chart type from its own folder.
  const chartsDir = path.join(root, "charts", "css");
  const charts = read("charts/css/charts.css").replace(
    /@import\s+(["'])(.*?)\1\s*;/g,
    (_match, _quote: string, specifier: string) => {
      if (!/^\.\/[a-z-]+\.css$/.test(specifier)) {
        throw new Error(`Unsupported chart CSS import: ${specifier}`);
      }
      return readFileSync(path.join(chartsDir, specifier), "utf8");
    },
  );
  let fonts = read("fonts/fonts.css");
  if (embed) {
    fonts = fonts.replaceAll("/fonts/", `${fontBaseUrl ?? "/fonts"}/`);
  } else {
    fonts = fonts.replace(
      /url\(\s*\/fonts\/([A-Za-z0-9._-]+\.woff2)\s*\)/g,
      (_match, filename: string) => {
        const data = readFileSync(path.join(root, "fonts", filename)).toString("base64");
        return `url(data:font/woff2;base64,${data})`;
      },
    );
  }
  const css = [
    read("tokens/build/tokens.css"),
    read("tokens/build/themes.css"),
    fonts,
    components,
    charts,
    "html{background:var(--ds-canvas)}body{margin:0}",
  ].join("\n");
  cssCache.set(key, css);
  return css;
}

/** CSS of the design system at `dsVersion`, ready for `composeDocument` (server only). */
export function getInfographicCss(options: {
  dsVersion: string;
  embed: boolean;
  fontBaseUrl?: string;
}): string {
  checkVersion(options.dsVersion);
  checkFontBaseUrl(options.fontBaseUrl);
  return loadCss(options.embed, options.fontBaseUrl);
}

export function buildDocument(fragment: string, options: BuildDocumentOptions): string {
  return composeDocument(fragment, {
    locale: options.locale,
    theme: options.theme,
    title: options.title,
    css: getInfographicCss(options),
    csp: options.embed ? CSP_IFRAME : CSP_STANDALONE,
  });
}
