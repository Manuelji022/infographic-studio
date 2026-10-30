// Pure string composition (no node:*): shared by the server renderer and the catalog.
export type DocumentLocale = "es" | "en";
export type DocumentTheme = "light" | "dark" | "auto";

export const LOCALES: readonly DocumentLocale[] = ["es", "en"];
export const THEMES: readonly DocumentTheme[] = ["light", "dark", "auto"];

export const CSP_IFRAME = "default-src 'none'; style-src 'unsafe-inline'; font-src data: 'self'";
export const CSP_STANDALONE = "default-src 'none'; style-src 'unsafe-inline'; font-src data:";

export type ComposeOptions = {
  locale: DocumentLocale;
  theme: DocumentTheme;
  css: string;
  csp: string;
  title?: string;
};

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function composeDocument(fragment: string, options: ComposeOptions): string {
  if (!LOCALES.includes(options.locale)) throw new Error("Unsupported locale");
  if (!THEMES.includes(options.theme)) throw new Error("Unsupported theme");
  // The fragment is validated before rendering; reject executable/style terminators defensively.
  if (/<\/style|<script/i.test(fragment)) throw new Error("Unsafe fragment content");
  if (/<\/style/i.test(options.css)) throw new Error("Unsafe css");
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta http-equiv="Content-Security-Policy" content="${options.csp}">`,
    `<title>${escapeText(options.title ?? "Infographic")}</title>`,
    `<style>${options.css}</style>`,
  ].join("");
  return [
    `<!doctype html><html lang="${options.locale}" data-ds-theme="${options.theme}">`,
    `<head>${head}</head>`,
    `<body><div class="ig-root">${fragment}</div></body></html>`,
  ].join("");
}
