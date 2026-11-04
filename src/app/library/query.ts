import type { Locale, MockInfographic } from "../../mocks/types";

export type LibrarySort = "relevance" | "date";

export type LibraryQuery = {
  q: string;
  tag: string;
  lang: Locale | "";
  shared: boolean;
  /** ISO calendar dates (YYYY-MM-DD), inclusive; compared on the UTC day of createdAt. */
  from: string;
  to: string;
  sort: LibrarySort;
  mock: "empty" | "error" | "slow" | "";
  /** Set by the delete redirect from the infographic view (?deleted=1). */
  deleted: boolean;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Real calendar date: the shape matches and it survives a round trip (rejects 2026-02-30). */
const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function parseQuery(params: RawParams): LibraryQuery {
  const q = first(params.q).trim().slice(0, 200);
  const lang = first(params.lang);
  const mock = first(params.mock);
  const sort = first(params.sort);
  const from = first(params.from);
  const to = first(params.to);
  let fromValid = isIsoDate(from) ? from : "";
  let toValid = isIsoDate(to) ? to : "";
  // An inverted range is swapped, so the inputs show the range that is actually applied.
  if (fromValid && toValid && fromValid > toValid) [fromValid, toValid] = [toValid, fromValid];
  return {
    q,
    tag: first(params.tag).slice(0, 80),
    lang: lang === "es" || lang === "en" ? lang : "",
    shared: first(params.shared) === "1",
    from: fromValid,
    to: toValid,
    // Relevance only makes sense with a query; default is relevance when q is present.
    sort: q ? (sort === "date" ? "date" : "relevance") : "date",
    mock: mock === "empty" || mock === "error" || mock === "slow" ? mock : "",
    deleted: first(params.deleted) === "1",
  };
}

/** Lowercase and strip diacritics so "energia" finds "Energía". */
export function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

const WEIGHTS = { title: 8, tags: 4, summary: 2, text: 1 } as const;

/** Score across every locale the infographic has. 0 = no match for some term. */
function score(item: MockInfographic, terms: string[]): number {
  const fields = { title: "", tags: "", summary: "", text: normalize(item.sourceText) };
  for (const content of Object.values(item.contents)) {
    fields.title += ` ${normalize(content.title)}`;
    fields.tags += ` ${normalize(content.tags.join(" "))}`;
    fields.summary += ` ${normalize(content.summary)}`;
  }
  let total = 0;
  for (const term of terms) {
    let termScore = 0;
    for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
      if (fields[key].includes(term)) termScore += WEIGHTS[key];
    }
    if (termScore === 0) return 0;
    total += termScore;
  }
  return total;
}

export function displayContent(item: MockInfographic, locale: Locale) {
  return item.contents[locale] ?? item.contents[item.originalLocale] ?? Object.values(item.contents)[0];
}

function inDateRange(item: MockInfographic, query: LibraryQuery): boolean {
  const day = item.createdAt.slice(0, 10);
  if (query.from && day < query.from) return false;
  if (query.to && day > query.to) return false;
  return true;
}

export function filterInfographics(items: MockInfographic[], query: LibraryQuery): MockInfographic[] {
  const terms = normalize(query.q).split(/\s+/).filter(Boolean);
  const tag = normalize(query.tag);
  const scored = items
    .filter((item) => !query.lang || item.contents[query.lang])
    .filter((item) => !query.tag || Object.values(item.contents).some((c) =>
      c.tags.some((t) => normalize(t) === tag)))
    .filter((item) => inDateRange(item, query))
    .map((item) => ({ item, score: terms.length ? score(item, terms) : 1 }))
    .filter((entry) => entry.score > 0);
  scored.sort((a, b) =>
    query.sort === "relevance" && b.score !== a.score
      ? b.score - a.score
      : b.item.createdAt.localeCompare(a.item.createdAt));
  return scored.map((entry) => entry.item);
}

/**
 * Tags from every locale of every infographic, so a filter stays valid when the
 * display language changes. One spelling per normalized form, sorted for the current locale.
 */
export function tagOptions(items: MockInfographic[], locale: Locale): string[] {
  const set = new Map<string, string>();
  for (const item of items) {
    for (const content of Object.values(item.contents)) {
      for (const tag of content?.tags ?? []) {
        const key = normalize(tag);
        if (!set.has(key)) set.set(key, tag);
      }
    }
  }
  return [...set.values()].sort((a, b) => a.localeCompare(b, locale));
}
