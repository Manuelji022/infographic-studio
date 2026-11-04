import { buildDocument, type DocumentTheme } from "@ds/infographic/render";
import { renderableFragment } from "./renderable-fragment";
import type { InfographicContent, Locale, MockInfographic } from "../../mocks/types";

const DS_VERSION = "1.0.0";

/** The content to show for `locale`, falling back to the original (flagged as `missing`). */
export function resolveContent(item: MockInfographic, locale: Locale) {
  const wanted = item.contents[locale];
  if (wanted) return { content: wanted, missing: false };
  const content = item.contents[item.originalLocale] ?? Object.values(item.contents)[0];
  return { content, missing: true };
}

/**
 * Embedded document (fonts by URL, iframe CSP) for the page, or the self-contained
 * document (fonts inlined as base64) for download and copy (FUNCTIONAL_SPEC §6.3).
 */
export function renderDocument(
  content: InfographicContent,
  options: { theme: DocumentTheme; embed: boolean },
): string {
  return buildDocument(renderableFragment(content.html), {
    locale: content.locale,
    theme: options.theme,
    dsVersion: DS_VERSION,
    embed: options.embed,
    title: content.title,
    charts: content.charts,
  });
}

export { renderableFragment };
