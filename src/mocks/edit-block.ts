// Fake LOCAL (single-block) agent edits. Same rules as edit.ts: deterministic transformations
// picked by keyword (ES and EN), never inventing data, never reporting success without a change.
//  - the edited block keeps its `data-block-id`; every other block's html and every other chart
//    spec stay byte-identical (the block is spliced in place and the chart array only has the
//    one spec replaced);
//  - data requests (a year, a comparison, year over year…) are refused (`missing-data`);
//  - an outcome that changes nothing is refused (`no-change`).
import { attributeValue, fragmentProblem, openTagAttrs, parseBlocks, replaceBlock, type Block } from "./blocks.ts";
import { DATA_REQUEST, STYLE, genericTweak, shorten, type BlockRef, type NotPossibleReason } from "./edit.ts";
import { validateChartSpec } from "../../design-system/charts/schema/index.ts";

export type BlockEditOutcome =
  | { kind: "changed"; html: string; charts: unknown[]; blockSeq: number; block: BlockRef; rules: string[] }
  | { kind: "notPossible"; reason: NotPossibleReason };

/** A chart edit that asks for another period or comparison has no data behind it. */
const CHART_DATA = /\ba[ñn]os?\b|\byears?\b|compar/;

const WANTS = {
  line: /l[ií]nea|\bline\b|\blines\b|line chart/,
  column: /columna|column|barra|\bbars?\b/,
  percent: /porcentaje|percent|\bshares?\b|proporci/,
  simplify: /simplif|\blabels?\b|etiqueta/,
  highlight: /destac|highlight|enfat|emphas/,
  shorter: /acort|shorter|resum|summar|reduc|corto|short|concis|menos texto|less text/,
  minimal: /minimal/,
};

type Spec = Record<string, unknown> & { type?: string; id?: string };

const refuse = (reason: NotPossibleReason): BlockEditOutcome => ({ kind: "notPossible", reason });
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function shortLabel(label: string): string {
  if (label.length <= 14) return label;
  const cut = label.search(/\s*[(:,–—-]\s/);
  const head = cut >= 4 ? label.slice(0, cut) : label;
  if (head.length <= 14) return head;
  const words = head.split(" ");
  let out = words[0];
  for (const word of words.slice(1)) {
    if (`${out} ${word}`.length > 14) break;
    out = `${out} ${word}`;
  }
  return out.length < head.length ? `${out}…` : out;
}

const unique = (values: readonly string[]) => new Set(values).size === values.length;
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Base fields in the order the example specs use, then the type-specific ones. */
function rebuild(spec: Spec, type: string, extra: Record<string, unknown>): Spec {
  const keys = ["id", "type", "title", "description", "sourceQuote", "unit", "note"];
  const out: Spec = {};
  for (const key of keys) {
    if (key === "type") out.type = type;
    else if (spec[key] !== undefined) out[key] = spec[key];
  }
  return Object.assign(out, extra);
}

function toColumn(spec: Spec): Spec | null {
  if (spec.type !== "line") return null;
  const x = spec.x as { kind: string; values: Array<string | number> };
  const series = spec.series as Array<{ name: string; values: Array<number | null>; projectedFrom?: number }>;
  if (x.values.length > 12 || series.length > 4) return null;
  if (series.some((item) => item.values.some((value) => !isNumber(value)))) return null;
  const categories = x.values.map(String);
  if (categories.some((category) => category.length > 40)) return null;
  const projected = series.some((item) => item.projectedFrom !== undefined);
  const next = rebuild(spec, "column", {
    categories,
    series: series.map((item) => ({ name: item.name, values: item.values as number[] })),
  });
  // A column chart has no dashed forecast segment: the note must not describe one.
  if (projected && typeof next.note === "string" && /discontin|dashed/i.test(next.note)) {
    const tail = next.note.split(":").slice(1).join(":").trim();
    if (tail) next.note = tail.charAt(0).toUpperCase() + tail.slice(1);
    else delete next.note;
  }
  return next;
}

function toLine(spec: Spec): Spec | null {
  if (spec.type !== "column") return null;
  const categories = spec.categories as string[];
  const series = spec.series as Array<{ name: string; values: number[] }>;
  return rebuild(spec, "line", {
    x: { kind: "category", values: categories },
    series: series.map((item) => ({ name: item.name, values: item.values })),
  });
}

function toPercent(spec: Spec): Spec | null {
  if (spec.type !== "column") return null;
  const unit = spec.unit as { kind?: string } | undefined;
  if (unit?.kind === "percent") return null;
  const series = spec.series as Array<{ name: string; values: number[] }>;
  const next = series.map((item) => {
    const total = item.values.reduce((sum, value) => sum + value, 0);
    if (total <= 0 || item.values.some((value) => value < 0)) return null;
    return { name: item.name, values: item.values.map((value) => Math.round((value / total) * 1000) / 10) };
  });
  if (next.some((item) => item === null)) return null;
  return { ...spec, unit: { kind: "percent", decimals: 1 }, series: next };
}

function simplifyLabels(spec: Spec): Spec | null {
  const next: Spec = { ...spec };
  let changed = false;
  if (spec.type === "column") {
    const categories = (spec.categories as string[]).map(shortLabel);
    if (!unique(categories)) return null;
    next.categories = categories;
    changed = !sameJson(categories, spec.categories);
  } else if (spec.type === "line" && (spec.x as { kind: string }).kind === "category") {
    const x = spec.x as { kind: string; values: string[] };
    const values = x.values.map(shortLabel);
    if (!unique(values)) return null;
    next.x = { ...x, values };
    changed = !sameJson(values, x.values);
  } else if (Array.isArray(spec.items) || Array.isArray(spec.parts)) {
    const key = Array.isArray(spec.items) ? "items" : "parts";
    const list = spec[key] as Array<{ label: string }>;
    const labels = list.map((entry) => shortLabel(entry.label));
    if (!unique(labels)) return null;
    next[key] = list.map((entry, index) => ({ ...entry, label: labels[index] }));
    changed = !sameJson(labels, list.map((entry) => entry.label));
  }
  return changed ? next : null;
}

function highlightMain(spec: Spec): Spec | null {
  const key = Array.isArray(spec.items) ? "items" : Array.isArray(spec.parts) ? "parts" : null;
  if (!key) return null;
  const list = spec[key] as Array<{ value?: unknown; emphasis?: string }>;
  let top = -1;
  list.forEach((entry, index) => {
    if (isNumber(entry.value) && (top === -1 || entry.value > (list[top].value as number))) top = index;
  });
  if (top === -1 || list[top].emphasis === "highlight") return null;
  return { ...spec, [key]: list.map((entry, index) => (index === top ? { ...entry, emphasis: "highlight" } : entry)) };
}

/** Last-resort visible tweak of a chart (regenerate with nothing else to do): toggles its description's final period. */
function chartVariant(spec: Spec): Spec | null {
  const flipped = toColumn(spec) ?? toLine(spec);
  if (flipped) return flipped;
  for (const key of ["description", "title"] as const) {
    const text = spec[key];
    if (typeof text === "string" && text.length > 1) {
      return { ...spec, [key]: text.endsWith(".") ? text.slice(0, -1) : `${text}.` };
    }
  }
  return null;
}

function chartSpecId(block: Block): string | null {
  return attributeValue(openTagAttrs(block.html), "data-chart");
}

/** Schema bounds for the text a chart spec carries (see design-system/charts/schema/common.ts). */
const TEXT_LIMITS = { title: 120, description: 280 } as const;
const SPEC_ID = /^[a-z][a-z0-9-]{0,31}$/;

/** `text` cut to `max` characters; a cut ends with an ellipsis that is part of the limit. */
function fit(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** The edits can push a text past its bound (a "." on a 120-character title): cut it back. */
function withinBounds(spec: Spec): Spec {
  let next = spec;
  for (const key of ["title", "description"] as const) {
    const value = spec[key];
    if (typeof value === "string" && value.length > TEXT_LIMITS[key]) {
      next = { ...next, [key]: fit(value, TEXT_LIMITS[key]) };
    }
  }
  return next;
}

/** Holes in the whole fragment that point at this spec (ids are [a-z0-9-], so no escaping). */
function holesFor(html: string, specId: string): number {
  return [...html.matchAll(new RegExp(`data-chart=(["']?)${specId}\\1(?=[\\s/>])`, "g"))].length;
}

/** A spec id, not used yet, for the copy of a shared spec: `<id>-2`, `<id>-3`… within the 32-character limit. */
function copyId(specId: string, charts: readonly unknown[]): string | null {
  const taken = new Set(charts.map((spec) => (spec as Spec)?.id));
  for (let n = 2; n < 100; n++) {
    const suffix = `-${n}`;
    const candidate = `${specId.slice(0, 32 - suffix.length)}${suffix}`;
    if (SPEC_ID.test(candidate) && !taken.has(candidate)) return candidate;
  }
  return null;
}

/** The block's opening tag with its data-chart pointing at `newId`, or null when it does not carry `oldId`. */
function repointOpenTag(block: Block, oldId: string, newId: string): string | null {
  const open = /^<[^>]*>/.exec(block.html)?.[0];
  if (!open) return null;
  const next = open.replace(new RegExp(`data-chart=(["']?)${oldId}\\1(?=[\\s/>])`), `data-chart="${newId}"`);
  return next === open ? null : next + block.html.slice(open.length);
}

type ChartEdit = { charts: unknown[]; rules: string[]; blockHtml?: string };

/**
 * Edits the chart of `block`. The new spec is checked against the chart schema before it is
 * returned, so an invalid spec is never stored. When the spec is shared by other holes, the
 * edited hole gets a copy with its own id and the others keep the original spec.
 */
function editChart(block: Block, html: string, text: string, charts: readonly unknown[], variant: boolean): ChartEdit | NotPossibleReason {
  const specId = chartSpecId(block)!;
  const index = charts.findIndex((spec) => (spec as Spec)?.id === specId);
  if (index === -1) return "unsupported";
  const spec = charts[index] as Spec;
  let next: Spec | null = null;
  let rule = "";
  if (variant) {
    next = chartVariant(spec);
    rule = "variant";
  } else if (WANTS.line.test(text) && !WANTS.column.test(text)) {
    next = toLine(spec);
    rule = "line";
  } else if (WANTS.column.test(text)) {
    next = toColumn(spec);
    rule = "column";
  } else if (WANTS.percent.test(text)) {
    next = toPercent(spec);
    rule = "percent";
  } else if (WANTS.simplify.test(text)) {
    next = simplifyLabels(spec);
    rule = "labels";
  } else if (WANTS.highlight.test(text)) {
    next = highlightMain(spec);
    rule = "highlight";
  } else {
    return "unsupported";
  }
  if (!next || sameJson(next, spec)) return "no-change";
  const fitted = withinBounds(next);
  if (!validateChartSpec(fitted).ok) return "invalid-spec";

  if (holesFor(html, specId) <= 1) {
    return { charts: charts.map((entry, i) => (i === index ? fitted : entry)), rules: [rule] };
  }
  const id = copyId(specId, charts);
  const blockHtml = id ? repointOpenTag(block, specId, id) : null;
  if (!id || !blockHtml) return "shared-spec";
  return { charts: [...charts, { ...fitted, id }], rules: [rule, "clone"], blockHtml };
}

const TEXT_P = /(<p class="ig-[a-z-]+__text">)([^<]*)(<\/p>)/g;

/**
 * The block's own html, with every nested block (a callout inside a section, a stat, a chart…)
 * swapped for a placeholder. Transformations only see the own part; `restore` puts the nested
 * html back byte for byte.
 */
function ownPart(html: string, block: Block, blocks: readonly Block[]): { own: string; restore: (own: string) => string } {
  const inner = blocks
    .filter((other) => other.nested && other.start > block.start && other.end <= block.end)
    .sort((a, b) => a.start - b.start);
  const kept: string[] = [];
  let own = "";
  let at = block.start;
  for (const other of inner) {
    if (other.start < at) continue;
    own += `${html.slice(at, other.start)}\u0000${kept.length}\u0000`;
    kept.push(html.slice(other.start, other.end));
    at = other.end;
  }
  own += html.slice(at, block.end);
  return { own, restore: (text) => text.replace(/\u0000(\d+)\u0000/g, (_match, i: string) => kept[Number(i)]) };
}

function editText(source: string, text: string, variant: boolean): { html: string; rules: string[] } | NotPossibleReason {
  let html = source;
  const rules: string[] = [];
  const step = (rule: string, next: string) => {
    if (next !== html) rules.push(rule);
    html = next;
  };
  if (!variant && !STYLE.test(text)) return "unsupported";
  if (!variant) {
    if (WANTS.shorter.test(text)) {
      step("shorten", html.replace(TEXT_P, (_m, open: string, body: string, close: string) => `${open}${shorten(body)}${close}`));
    }
    if (WANTS.minimal.test(text)) step("minimal", html.replaceAll(" ig-card--feature", ""));
    if (WANTS.highlight.test(text)) {
      step("highlight", html.replace(/<div class="ig-card( ig-card--deep)?">/, '<div class="ig-card ig-card--feature">'));
    }
  }
  if (rules.length === 0) step(variant ? "variant" : "generic", genericTweak(html));
  // genericTweak finds the first lead line of the *fragment*; fall back to the block's first text paragraph.
  if (rules.length === 0) {
    step(
      variant ? "variant" : "generic",
      html.replace(TEXT_P, (_m, open: string, body: string, close: string) => `${open}${body.endsWith(".") ? body.slice(0, -1) : `${body}.`}${close}`),
    );
  }
  if (html === source) return "no-change";
  return { html, rules };
}

export type BlockEditOptions = { variant?: boolean };

/**
 * Applies `instruction` to the block `blockId` only. With `variant` (a regenerate with nothing
 * new to say) it makes a neutral deterministic tweak instead of interpreting the text.
 */
export function applyBlockInstruction(
  html: string,
  charts: readonly unknown[],
  blockSeq: number,
  blockId: string,
  instruction: string,
  options: BlockEditOptions = {},
): BlockEditOutcome {
  if (fragmentProblem(html)) return refuse("malformed");
  const blocks = parseBlocks(html, { charts });
  const block = blocks.find((candidate) => candidate.id === blockId && !candidate.opaque);
  if (!block) return refuse("unsupported");
  const text = instruction.toLowerCase();
  const variant = options.variant === true;
  if (!variant && DATA_REQUEST.test(text)) return refuse("missing-data");
  if (!variant && block.type === "chart" && CHART_DATA.test(text)) return refuse("missing-data");

  let nextHtml = html;
  let nextCharts: unknown[] = [...charts];
  let rules: string[];
  if (block.type === "chart" && chartSpecId(block)) {
    const result = editChart(block, html, text, charts, variant);
    if (typeof result === "string") return refuse(result);
    nextCharts = result.charts;
    rules = result.rules;
    if (result.blockHtml !== undefined) {
      const repointed = replaceBlock(html, blockId, result.blockHtml, { charts: nextCharts });
      if (!repointed.ok) return refuse("malformed");
      nextHtml = repointed.html;
    }
  } else {
    // Only the block's own content changes: nested blocks (with their own data-block-id) are kept as they are.
    const own = ownPart(html, block, blocks);
    const result = editText(own.own, text, variant);
    if (typeof result === "string") return refuse(result);
    const replaced = replaceBlock(html, blockId, own.restore(result.html), { charts });
    if (!replaced.ok) return refuse("malformed");
    nextHtml = replaced.html;
    rules = result.rules;
  }

  // Safety net: the same ids, in the same order, and the edited block still has its own.
  const ids = (value: string, specs: readonly unknown[]) => parseBlocks(value, { charts: specs }).map((item) => item.id);
  if (!sameJson(ids(html, charts), ids(nextHtml, nextCharts))) return refuse("malformed");
  if (nextHtml === html && sameJson(nextCharts, charts)) return refuse("no-change");
  const name = parseBlocks(nextHtml, { charts: nextCharts }).find((item) => item.id === blockId)?.name ?? block.name;
  return { kind: "changed", html: nextHtml, charts: nextCharts, blockSeq, block: { id: blockId, name }, rules };
}
