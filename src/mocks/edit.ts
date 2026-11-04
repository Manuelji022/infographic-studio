// Fake agent edits: deterministic transformations chosen by keyword in the instruction (ES and
// EN). They only prove the interface works and never invent data:
//  - anything that asks for data, a year, a comparison or a forecast is refused before any
//    change (`missing-data`);
//  - only style-like instructions run; any other text is refused (`unsupported`);
//  - an outcome that changes nothing is refused (`no-change`). Success always changes something.
// Block ids come from the stored html and are kept; new blocks get ids from the infographic's
// counter. Blocks the transformation does not touch stay byte-identical.
import { ensureBlockIds, fragmentProblem, scanElements, topLevelBlocks, type Block } from "./blocks.ts";

export type BlockRef = { id: string; name: string };

export type NotPossibleReason =
  | "missing-data"
  | "unsupported"
  | "malformed"
  | "no-change"
  /** A chart spec shared by several holes cannot be cloned for the edited one. */
  | "shared-spec"
  /** The transformed chart spec does not pass the chart schema: nothing is stored. */
  | "invalid-spec";

export type EditOutcome =
  | { kind: "changed"; html: string; blockSeq: number; changedBlocks: BlockRef[]; rules: string[] }
  | { kind: "notPossible"; reason: NotPossibleReason };

/**
 * Asks for data that the source text does not contain: it must ASK to add, compare, project or
 * invent something. A year or a noun like "comparación" inside a style request ("make the 2024
 * heading more concise", "haz más minimalista la comparación") is not a data request.
 */
const ADD_VERB = String.raw`(?:a[ñn]ad|add|agreg|incluy|includ|insert|muestr|show|dame|give|extiend|extend)\w*`;
const DATA_NOUN =
  String.raw`(?:dato|cifra|data|figure|number|estad[ií]stic|statistic|year|a[ñn]o|cita|quote|fuente|source|comparaci|comparison|forecast|previsi|pron[oó]stic|proyecci|projection|tendencia|trend)`;
export const DATA_REQUEST = new RegExp(
  [
    String.raw`\binvent(?:a|ar|e|es|ed|ing|s)?\b|\bmake up\b|\bfabricat\w*|\bfabrica(?:r|s)?\b`,
    String.raw`\b(?:compar(?:a|ar|e|es|o|ando)|compare|compared|comparing|versus|vs\.?)\b`,
    String.raw`\b(?:forecast|pronostic(?:a|ar)|predic(?:e|ir|t)|proyecta|project)\b`,
    String.raw`interanual|\byoy\b|year[- ]over[- ]year`,
    String.raw`\b${ADD_VERB}\s+(?:[\wñáéíóú]+\s+){0,3}?${DATA_NOUN}`,
    // A year next to a verb that asks for data.
    String.raw`\b(?:${ADD_VERB}|forecast|predict\w*|pron\w+|proyect\w*)\b.*\b(?:19|20)\d{2}\b`,
  ].join("|"),
);

/** Instructions about style or length: the only ones the fallback is allowed to answer. */
export const STYLE =
  /estil|style|tono|tone|dise[ñn]|design|visual|color|minimal|ejecut|executive|formal|reduc|menos texto|shorter|less text|corto|short|concis|concise|conclu|destac|highlight|enfat|emphas|simpl|resum|summar|texto|\btext\b/;

const KEYWORDS = {
  executive: /ejecutiv|executive/,
  shorter: /reduc|menos texto|shorter|less text/,
  minimal: /minimal/,
  conclusions: /conclu|highlight|destac/,
};

export function shorten(text: string): string {
  const first = /^(.+?[.!?])(\s|$)/.exec(text)?.[1] ?? text;
  if (first.length <= 80) return first;
  const clause = first.search(/,\s|;\s/);
  return clause >= 30 ? `${first.slice(0, clause)}.` : first;
}

export function shortenTexts(html: string): string {
  return html.replace(
    /(<p class="ig-(?:card|callout)__text">)([^<]*)(<\/p>)/g,
    (_match, open: string, text: string, close: string) => `${open}${shorten(text)}${close}`,
  );
}

/** Removes every element matching `predicate` (with its content), outermost match first. */
export function removeElements(html: string, predicate: (classes: string[]) => boolean): string {
  const ranges: Array<[number, number]> = [];
  let until = -1;
  for (const element of scanElements(html).elements) {
    if (element.start < until) continue;
    if (predicate(element.classes)) {
      ranges.push([element.start, element.end]);
      until = element.end;
    }
  }
  let result = html;
  for (const [start, end] of ranges.reverse()) result = result.slice(0, start) + result.slice(end);
  return result;
}

function dropMeasures(html: string): string {
  return removeElements(html, (classes) => classes.includes("ig-section__measure"));
}

function minimal(html: string): string {
  return removeElements(html, (classes) => classes.includes("ig-callout")).replaceAll(" ig-card--feature", "");
}

/** Emphasises the last section that has a plain card, the closest thing to a conclusion block. */
function highlightConclusions(html: string): string {
  const sections = topLevelBlocks(html).filter((block) => block.type === "section");
  for (const section of [...sections].reverse()) {
    const plain = /<div class="ig-card( ig-card--deep)?">/.exec(section.html);
    if (plain) {
      const next = section.html.replace(plain[0], '<div class="ig-card ig-card--feature">');
      return html.slice(0, section.start) + next + html.slice(section.end);
    }
  }
  return html;
}

/** Small wording tweak of the lead line (the first section's, or the header's): toggles its final period. */
export function genericTweak(html: string): string {
  const lead =
    /(<p class="ig-section__measure">)([^<]*)(<\/p>)/.exec(html) ??
    /(<p class="ig-header__lede">)([^<]*)(<\/p>)/.exec(html);
  if (!lead) return html;
  const text = lead[2].endsWith(".") ? lead[2].slice(0, -1) : `${lead[2]}.`;
  return html.slice(0, lead.index) + lead[1] + text + lead[3] + html.slice(lead.index + lead[0].length);
}

function refuse(reason: NotPossibleReason): EditOutcome {
  return { kind: "notPossible", reason };
}

export function applyInstruction(
  html: string,
  instruction: string,
  charts: readonly unknown[] = [],
  blockSeq = 0,
): EditOutcome {
  const text = instruction.toLowerCase();
  if (DATA_REQUEST.test(text)) return refuse("missing-data");
  if (fragmentProblem(html)) return refuse("malformed");
  if (!STYLE.test(text)) return refuse("unsupported");

  const rules: string[] = [];
  let next = html;
  const step = (rule: string, transform: (value: string) => string) => {
    const result = transform(next);
    if (result !== next) rules.push(rule);
    next = result;
  };
  if (KEYWORDS.executive.test(text) || KEYWORDS.shorter.test(text)) {
    step("shorten", shortenTexts);
    if (KEYWORDS.shorter.test(text)) step("measures", dropMeasures);
    else step("callouts", (value) => removeElements(value, (classes) => classes.includes("ig-callout--neutral")));
  }
  if (KEYWORDS.minimal.test(text)) step("minimal", minimal);
  if (KEYWORDS.conclusions.test(text)) step("conclusions", highlightConclusions);
  // The fallback answers style requests that no specific rule covered, nothing else.
  if (rules.length === 0) step("generic", genericTweak);

  const ids = ensureBlockIds(next, blockSeq, { charts });
  if (!ids.ok) return refuse("malformed");
  next = ids.html;

  const before = new Map<string | null, Block>(topLevelBlocks(html, { charts }).map((block) => [block.id, block]));
  const changedBlocks = topLevelBlocks(next, { charts })
    .filter((block) => before.get(block.id)?.html !== block.html)
    .map((block) => ({ id: block.id!, name: block.name }));
  if (changedBlocks.length === 0) return refuse("no-change");
  return { kind: "changed", html: next, blockSeq: ids.seq, changedBlocks, rules };
}
