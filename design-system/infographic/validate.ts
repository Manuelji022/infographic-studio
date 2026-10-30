import {
  ALLOWED_ATTRIBUTES,
  ALLOWED_CLASSES,
  ALLOWED_ENTITIES,
  ALLOWED_TAGS,
  CHART_ATTRIBUTE,
  CHART_ID_PATTERN,
  DATA_PROPS,
  MAX_FRAGMENT_BYTES,
  ROOT_CLASS,
  VOID_TAGS,
} from "./manifest.ts";

export type ValidationCode =
  | "chart-hole-invalid"
  | "too-large"
  | "bad-syntax"
  | "tag-not-allowed"
  | "attribute-not-allowed"
  | "class-unknown"
  | "style-invalid"
  | "entity-not-allowed"
  | "unbalanced"
  | "text-outside";
export type ValidationIssue = {
  code: ValidationCode;
  message: string;
  index: number;
};
export type ValidationResult =
  | { ok: true }
  | { ok: false; issues: ValidationIssue[] };

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  rarr: "→",
  larr: "←",
  uarr: "↑",
  darr: "↓",
  times: "×",
  minus: "−",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  middot: "·",
  euro: "€",
  percnt: "%",
};

export function validateFragment(html: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (code: ValidationCode, message: string, index: number): void => {
    if (issues.length < 50) {
      issues.push({ code, message, index });
    }
  };
  if (new TextEncoder().encode(html).length > MAX_FRAGMENT_BYTES) {
    add("too-large", "Fragment exceeds the byte limit", 0);
    return { ok: false, issues };
  }
  if (!html.trim()) {
    add("bad-syntax", "Fragment is empty", 0);
  }
  // Whole-input scan: C0/C1 controls (except tab, LF, CR) and bidi overrides, anywhere.
  const forbidden =
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;
  for (const match of html.matchAll(forbidden)) {
    add("bad-syntax", "Control or bidi character", match.index ?? 0);
  }
  const stack: string[] = [];
  const decode = (value: string, offset: number): string => {
    let result = "";
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== "&") {
        result += value[i];
        continue;
      }
      const end = value.indexOf(";", i + 1);
      if (end < 0) {
        add("entity-not-allowed", "Invalid entity", offset + i);
        continue;
      }
      const name = value.slice(i + 1, end);
      let cp: number | undefined;
      if (/^#\d+$/.test(name)) {
        cp = Number(name.slice(1));
      } else if (/^#x[\da-f]+$/i.test(name)) {
        cp = Number.parseInt(name.slice(2), 16);
      } else if (ALLOWED_ENTITIES.has(name)) {
        result += entities[name] ?? "";
        i = end;
        continue;
      } else {
        add("entity-not-allowed", "Entity is not allowed", offset + i);
        i = end;
        continue;
      }
      if (
        cp === undefined ||
        cp > 0x10ffff ||
        cp < 0x20 ||
        (cp >= 0x7f && cp <= 0x9f) ||
        (cp >= 0xd800 && cp <= 0xdfff)
      ) {
        add("entity-not-allowed", "Invalid numeric entity", offset + i);
      } else {
        result += String.fromCodePoint(cp);
      }
      i = end;
    }
    return result;
  };
  for (let i = 0; i < html.length; ) {
    const c = html[i];
    if (c !== "<") {
      let end = html.indexOf("<", i);
      if (end < 0) {
        end = html.length;
      }
      const decoded = decode(html.slice(i, end), i);
      if (/[<>]/.test(decoded)) {
        add("bad-syntax", "Angle bracket in text", i);
      }
      if (!stack.length && decoded.trim()) {
        add("text-outside", "Text outside root element", i);
      }
      i = end;
      continue;
    }
    if (html.startsWith("<!--", i) || html.startsWith("<!", i) || html.startsWith("<?", i)) {
      add("bad-syntax", "Markup declaration is not allowed", i);
      i++;
      continue;
    }
    let j = i + 1;
    const closing = html[j] === "/";
    if (closing) {
      j++;
    }
    const start = j;
    while (j < html.length && /[A-Za-z0-9]/.test(html[j])) {
      j++;
    }
    const rawName = html.slice(start, j);
    if (!/^[a-z][a-z0-9]*$/.test(rawName)) {
      add("bad-syntax", "Malformed tag", i);
      i++;
      continue;
    }
    if (!ALLOWED_TAGS.has(rawName)) {
      add("tag-not-allowed", "Tag is not allowed", i);
    }
    if (closing) {
      while (/\s/.test(html[j] ?? "")) {
        j++;
      }
      if (html[j] !== ">") {
        add("bad-syntax", "Malformed closing tag", i);
        i++;
        continue;
      }
      if (VOID_TAGS.has(rawName) || stack.pop() !== rawName) {
        add("unbalanced", "Mismatched closing tag", i);
      }
      i = j + 1;
      continue;
    }
    const attrs = new Set<string>();
    let chartClass = false;
    let chartId: string | undefined;
    let selfClose = false;
    while (j < html.length) {
      while (/\s/.test(html[j] ?? "")) {
        j++;
      }
      if (html.startsWith("/>", j)) {
        selfClose = true;
        j += 2;
        break;
      }
      if (html[j] === ">") {
        j++;
        break;
      }
      const at = j;
      while (j < html.length && /[A-Za-z0-9-]/.test(html[j])) {
        j++;
      }
      const name = html.slice(at, j);
      if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        add("bad-syntax", "Malformed attribute", j);
        j++;
        continue;
      }
      if (attrs.has(name)) {
        add("bad-syntax", "Duplicate attribute", at);
      }
      attrs.add(name);
      if (!ALLOWED_ATTRIBUTES.has(name) && name !== CHART_ATTRIBUTE) {
        add("attribute-not-allowed", "Attribute is not allowed", at);
      }
      while (/\s/.test(html[j] ?? "")) {
        j++;
      }
      if (html[j++] !== "=") {
        add("bad-syntax", "Attribute value required", j - 1);
        continue;
      }
      while (/\s/.test(html[j] ?? "")) {
        j++;
      }
      if (html[j] !== '"') {
        add("bad-syntax", "Double-quoted value required", j);
        continue;
      }
      const valueAt = ++j;
      while (j < html.length && html[j] !== '"') {
        j++;
      }
      const value = html.slice(valueAt, j);
      if (html[j] === '"') {
        j++;
      }
      const decoded = decode(value, valueAt);
      if (
        /[<>\n\r\t]/.test(value) ||
        /(javascript:|data:|vbscript:|url\s*\(|expression\s*\()/i.test(decoded)
      ) {
        add("bad-syntax", "Unsafe attribute value", valueAt);
      }
      if (name === CHART_ATTRIBUTE) {
        chartId = value;
      }
      if (name === "class") {
        chartClass ||= decoded.split(/\s+/).includes("ig-chart");
        for (const token of value.split(/\s+/).filter(Boolean)) {
          if (!ALLOWED_CLASSES.has(token) || token === ROOT_CLASS) {
            add("class-unknown", "Unknown class", valueAt);
          }
        }
      }
      if (name === "style") {
        const declarations = value.split(";").filter((part) => part.trim());
        for (const declaration of declarations) {
          const match = /^\s*(--[a-z0-9-]+)\s*:\s*(-?\d+(?:\.\d+)?)\s*$/.exec(
            declaration,
          );
          if (!match || !DATA_PROPS.includes(match[1])) {
            add("style-invalid", "Invalid style declaration", valueAt);
          }
        }
      }
    }
    if (chartClass) {
      // Accept one spelling so expansion never disagrees with HTML attribute parsing.
      const canonical = `<div class="ig-chart" data-chart="${chartId}">`;
      if (
        chartId === undefined ||
        !CHART_ID_PATTERN.test(chartId) ||
        html.slice(i, j) !== canonical ||
        !html.startsWith("</div>", j)
      ) {
        add("chart-hole-invalid", "Chart hole must be canonical and empty", i);
      }
    } else if (attrs.has(CHART_ATTRIBUTE)) {
      add("attribute-not-allowed", "data-chart is only allowed on a chart hole", i);
    }
    if (j > html.length || (html[j - 1] !== ">" && !selfClose)) {
      add("bad-syntax", "Unterminated tag", i);
    }
    if (selfClose && !VOID_TAGS.has(rawName)) {
      add("bad-syntax", "Only void tags self-close", i);
    }
    if (!selfClose && !VOID_TAGS.has(rawName)) {
      stack.push(rawName);
    }
    i = Math.max(j, i + 1);
  }
  if (stack.length) {
    add("unbalanced", "Unclosed tag", html.length);
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function chartReferences(html: string): string[] {
  if (!validateFragment(html).ok) {
    throw new Error("Cannot read chart references from an invalid fragment");
  }
  const holes = /<div class="ig-chart" data-chart="([a-z][a-z0-9-]{0,31})"><\/div>/g;
  return Array.from(html.matchAll(holes), (match) => match[1]);
}
