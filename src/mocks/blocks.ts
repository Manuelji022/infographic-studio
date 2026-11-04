// Mock document model: an infographic HTML fragment as an ordered list of editable blocks.
//
// Identity: every block root carries `data-block-id` IN the stored fragment. Ids are assigned
// once by `ensureBlockIds` (kind prefix + a per-infographic counter that never goes back), so
// editing one block never renames another, and undo/redo restore the exact ids.
//
// No parser dependency: a small balanced-tag scanner. It skips comments and declarations,
// knows the HTML void elements and accepts double, single and unquoted attribute values. Any
// fragment it cannot balance is reported as malformed and is never spliced.

export type BlockType =
  | "header"
  | "section"
  | "chart"
  | "stat"
  | "quote"
  | "timeline"
  | "callout"
  | "verdict"
  | "footer"
  | "text";

export type Block = {
  /** Persisted `data-block-id`; null only when the html has not been through ensureBlockIds. */
  id: string | null;
  type: BlockType;
  /** Human title taken from the block's heading. */
  name: string;
  html: string;
  /** True for blocks nested inside a top-level block (stat, callout, chart…). */
  nested: boolean;
  /** True when the fragment is malformed: the whole html is one opaque block that cannot be edited. */
  opaque: boolean;
  start: number;
  end: number;
};

type Element = {
  tag: string;
  classes: string[];
  attrs: string;
  blockId: string | null;
  start: number;
  openEnd: number;
  end: number;
  depth: number;
  parent: number;
};

export type ScanResult = { elements: Element[]; malformed: string | null };

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const TAG_AT = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/y;
export type Attr = { name: string; value: string | null; raw: string };

const ATTR_AT = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;

/**
 * Real attributes of an open tag's attribute text, tokenised left to right. Text that merely
 * looks like an attribute inside a quoted value (`title="x data-block-id=y"`) is never read.
 */
export function parseAttributes(attrs: string): Attr[] {
  const out: Attr[] = [];
  let at = 0;
  while (at < attrs.length) {
    const rest = /^[\s/]*/.exec(attrs.slice(at))![0].length;
    at += rest;
    if (at >= attrs.length) break;
    ATTR_AT.lastIndex = at;
    const match = ATTR_AT.exec(attrs);
    if (!match) {
      at += 1;
      continue;
    }
    out.push({ name: match[1].toLowerCase(), value: match[2] ?? match[3] ?? match[4] ?? null, raw: match[0] });
    at += match[0].length;
  }
  return out;
}

/** Value of attribute `name` in `attrs` (the text after the tag name), or null. */
export function attributeValue(attrs: string, name: string): string | null {
  return parseAttributes(attrs).find((attr) => attr.name === name)?.value ?? null;
}

/** Attribute text of the first open tag of `html` (everything after the tag name). */
export function openTagAttrs(html: string): string {
  TAG_AT.lastIndex = html.indexOf("<");
  return TAG_AT.exec(html)?.[3] ?? "";
}

const fail = (malformed: string): ScanResult => ({ elements: [], malformed });

/** Balanced-tag scan of the whole fragment. Reports the first structural problem it meets. */
export function scanElements(html: string): ScanResult {
  const elements: Element[] = [];
  const stack: number[] = [];
  let at = 0;
  for (;;) {
    const lt = html.indexOf("<", at);
    if (lt === -1) break;
    if (html.startsWith("<!--", lt)) {
      const close = html.indexOf("-->", lt + 4);
      if (close === -1) return fail("unclosed comment");
      at = close + 3;
      continue;
    }
    if (html[lt + 1] === "!" || html[lt + 1] === "?") {
      const close = html.indexOf(">", lt);
      if (close === -1) return fail("unclosed declaration");
      at = close + 1;
      continue;
    }
    TAG_AT.lastIndex = lt;
    const match = TAG_AT.exec(html);
    if (!match) return fail(`stray "<" at ${lt}`);
    const [raw, closing, rawTag, rest] = match;
    const tag = rawTag.toLowerCase();
    const end = lt + raw.length;
    at = end;
    if (closing) {
      const top = stack[stack.length - 1];
      if (top === undefined || elements[top].tag !== tag) return fail(`unexpected </${tag}> at ${lt}`);
      elements[top].end = end;
      stack.pop();
      continue;
    }
    // A trailing slash only closes void elements; on any other tag browsers ignore it.
    const selfClosed = VOID.has(tag);
    const classValue = attributeValue(rest, "class");
    elements.push({
      tag,
      classes: classValue ? classValue.split(/\s+/).filter(Boolean) : [],
      attrs: rest,
      blockId: attributeValue(rest, "data-block-id"),
      start: lt,
      openEnd: end,
      end,
      depth: stack.length,
      parent: stack.length ? stack[stack.length - 1] : -1,
    });
    if (!selfClosed) stack.push(elements.length - 1);
  }
  if (stack.length) return fail(`unclosed <${elements[stack[stack.length - 1]].tag}>`);
  return { elements, malformed: null };
}

export function fragmentProblem(html: string): string | null {
  return scanElements(html).malformed;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
  "&rarr;": "→",
  "&ndash;": "–",
  "&mdash;": "—",
  "&hellip;": "…",
  "&middot;": "·",
};

function plainText(fragment: string): string {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 56): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Block kind for an element, or null when it is just content inside a block. */
function kindOf(element: Element): BlockType | null {
  const has = (name: string) => element.classes.includes(name);
  if (has("ig-header")) return "header";
  if (has("ig-section")) return "section";
  if (has("ig-verdict")) return "verdict";
  if (has("ig-footer")) return "footer";
  if (has("ig-chart") || has("ig-bar-chart")) return "chart";
  if (has("ig-timeline")) return "timeline";
  if (has("ig-callout")) return "callout";
  if (has("ig-quote")) return "quote";
  if (has("ig-stat")) return "stat";
  return null;
}

/** Kinds allowed inside a top-level block (one level deep). */
const NESTED: ReadonlySet<BlockType> = new Set(["chart", "stat", "quote", "timeline", "callout"]);

export type ParseOptions = {
  /** Chart specs, used to name charts by their title. */
  charts?: readonly unknown[];
};

function nameOf(html: string, elements: Element[], index: number, type: BlockType, titles: Map<string, string>): string {
  const element = elements[index];
  const blockHtml = html.slice(element.start, element.end);
  if (type === "chart") {
    const chartId =
      attributeValue(element.attrs, "data-chart") ?? /\bid="chart-([a-z0-9-]+)-title"/.exec(blockHtml)?.[1];
    const title = chartId ? titles.get(chartId) : undefined;
    if (title) return truncate(title);
    if (element.classes.includes("ig-bar-chart")) return ""; // its labels are data, not a title
  }
  const inner: Element[] = [];
  for (let j = index + 1; j < elements.length && elements[j].start < element.end; j++) inner.push(elements[j]);
  const title = inner.find((child) => child.classes.some((name) => /__(title|label)$/.test(name)));
  const heading = title ?? inner.find((child) => /^h[1-6]$/.test(child.tag));
  if (heading) {
    const text = plainText(html.slice(heading.openEnd, heading.end));
    if (text) return truncate(text);
  }
  return truncate(plainText(blockHtml));
}

function titlesFrom(charts: readonly unknown[]): Map<string, string> {
  const titles = new Map<string, string>();
  for (const spec of charts) {
    const record = spec as { id?: unknown; title?: unknown };
    if (typeof record.id === "string" && typeof record.title === "string") titles.set(record.id, record.title);
  }
  return titles;
}

/** Ordered blocks: top-level ones plus nested chart/stat/quote/timeline/callout blocks. */
export function parseBlocks(html: string, options: ParseOptions = {}): Block[] {
  const scan = scanElements(html);
  if (scan.malformed) {
    return [{ id: null, type: "text", name: truncate(plainText(html)), html, nested: false, opaque: true, start: 0, end: html.length }];
  }
  const { elements } = scan;
  const titles = titlesFrom(options.charts ?? []);
  const blocks: Block[] = [];
  const blockOf = new Map<number, Block>();

  elements.forEach((element, index) => {
    const kind = kindOf(element);
    let top: Block | null = null;
    for (let cursor = element.parent; cursor !== -1; cursor = elements[cursor].parent) {
      const found = blockOf.get(cursor);
      if (found) {
        top = found;
        break;
      }
    }
    let type: BlockType;
    let nested = false;
    if (element.depth === 0) {
      type = kind ?? "text";
    } else if (kind && NESTED.has(kind) && top && !top.nested) {
      type = kind;
      nested = true;
    } else {
      return;
    }
    const name = nameOf(html, elements, index, type, titles) || (nested && top ? top.name : type);
    const block: Block = {
      id: element.blockId,
      type,
      name,
      html: html.slice(element.start, element.end),
      nested,
      opaque: false,
      start: element.start,
      end: element.end,
    };
    blockOf.set(index, block);
    blocks.push(block);
  });
  return blocks;
}

export function topLevelBlocks(html: string, options: ParseOptions = {}): Block[] {
  return parseBlocks(html, options).filter((block) => !block.nested);
}

export type IdsResult = { ok: true; html: string; seq: number } | { ok: false; reason: string };

/**
 * Gives every block root a `data-block-id` that is then stored with the html. Existing ids are
 * kept as they are; new ids are `<kind>-<n>` with n taken from `seq` (the counter of the
 * infographic) and never reused. Idempotent: a second call changes nothing.
 */
export function ensureBlockIds(html: string, seq: number, options: ParseOptions = {}): IdsResult {
  const problem = fragmentProblem(html);
  if (problem) return { ok: false, reason: problem };
  const blocks = parseBlocks(html, options);
  let next = seq;
  const seen = new Set<string>();
  for (const block of blocks) {
    if (!block.id) continue;
    if (seen.has(block.id)) return { ok: false, reason: `duplicate block id ${block.id}` };
    seen.add(block.id);
    const number = /-(\d+)$/.exec(block.id);
    if (number) next = Math.max(next, Number(number[1]));
  }
  const minted = new Map<Block, string>();
  for (const block of blocks) {
    if (!block.id) minted.set(block, `${block.type}-${++next}`);
  }
  let out = html;
  for (const block of [...blocks].reverse()) {
    const id = minted.get(block);
    if (!id) continue;
    const tagEnd = block.start + /^<[a-zA-Z][\w-]*/.exec(html.slice(block.start))![0].length;
    out = `${out.slice(0, tagEnd)} data-block-id="${id}"${out.slice(tagEnd)}`;
  }
  return { ok: true, html: out, seq: next };
}

export type ReplaceResult = { ok: true; html: string } | { ok: false; reason: string };

/**
 * Replaces whole blocks by id. Refuses (and changes nothing) when the fragment is malformed,
 * an id is unknown, a replacement is malformed, a replacement drops or changes its
 * `data-block-id`, or two targets overlap.
 */
export function replaceBlocks(html: string, replacements: ReadonlyMap<string, string>, options: ParseOptions = {}): ReplaceResult {
  const problem = fragmentProblem(html);
  if (problem) return { ok: false, reason: problem };
  const blocks = parseBlocks(html, options);
  const targets: Block[] = [];
  for (const [id, replacement] of replacements) {
    const block = blocks.find((candidate) => candidate.id === id);
    if (!block) return { ok: false, reason: `unknown block ${id}` };
    if (fragmentProblem(replacement)) return { ok: false, reason: `malformed replacement for ${id}` };
    if (attributeValue(openTagAttrs(replacement), "data-block-id") !== id) {
      return { ok: false, reason: `replacement for ${id} must keep its data-block-id` };
    }
    targets.push(block);
  }
  for (const a of targets) {
    for (const b of targets) {
      if (a !== b && b.start < a.end && a.start < b.end) return { ok: false, reason: "overlapping targets" };
    }
  }
  let out = html;
  for (const block of [...targets].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, block.start) + replacements.get(block.id!)! + out.slice(block.end);
  }
  return { ok: true, html: out };
}

export function replaceBlock(html: string, id: string, newHtml: string, options: ParseOptions = {}): ReplaceResult {
  return replaceBlocks(html, new Map([[id, newHtml]]), options);
}
