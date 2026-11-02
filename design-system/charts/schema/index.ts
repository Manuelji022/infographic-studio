import { z } from "zod";
import { columnSpecSchema } from "./column.ts";
import { type ChartIssue, type ChartIssueCode } from "./common.ts";
import { donutSpecSchema } from "./donut.ts";
import { lineSpecSchema } from "./line.ts";
import { pictogramSpecSchema } from "./pictogram.ts";
import { rankingSpecSchema } from "./ranking.ts";
import { scatterSpecSchema } from "./scatter.ts";
import { stackedSpecSchema } from "./stacked.ts";
import { treemapSpecSchema } from "./treemap.ts";

export * from "./common.ts";
export { columnSpecSchema, type ColumnSpec } from "./column.ts";
export { donutSpecSchema, type DonutSpec } from "./donut.ts";
export { lineSpecSchema, type LineSpec } from "./line.ts";
export { pictogramSpecSchema, type PictogramSpec } from "./pictogram.ts";
export { rankingSpecSchema, type RankingSpec } from "./ranking.ts";
export { scatterSpecSchema, type ScatterSpec } from "./scatter.ts";
export { stackedSpecSchema, type StackedSpec } from "./stacked.ts";
export { treemapSpecSchema, type TreemapSpec } from "./treemap.ts";

const chartTypes = [
  "line",
  "column",
  "stacked",
  "donut",
  "pictogram",
  "scatter",
  "ranking",
  "treemap",
] as const;

export const chartSpecSchema = z.discriminatedUnion("type", [
  lineSpecSchema,
  columnSpecSchema,
  stackedSpecSchema,
  donutSpecSchema,
  pictogramSpecSchema,
  scatterSpecSchema,
  rankingSpecSchema,
  treemapSpecSchema,
]);

export type ChartSpec = z.infer<typeof chartSpecSchema>;

function readPath(input: unknown, path: readonly PropertyKey[]): unknown {
  let current = input;
  for (const segment of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = (current as Record<PropertyKey, unknown>)[segment];
  }
  return current;
}

function hasPath(input: unknown, path: readonly PropertyKey[]): boolean {
  if (path.length === 0) {
    return true;
  }
  let current = input;
  for (const segment of path) {
    if (typeof current !== "object" || current === null) {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return false;
    }
    current = (current as Record<PropertyKey, unknown>)[segment];
  }
  return true;
}

function normalizePath(path: readonly PropertyKey[]): (string | number)[] {
  return path.filter(
    (segment): segment is string | number =>
      typeof segment === "string" || typeof segment === "number",
  );
}

function parseTaggedIssue(message: string):
  | { code: ChartIssueCode; message: string }
  | undefined {
  const taggedCodes = [
    "invalid-type",
    "out-of-range",
    "length-mismatch",
    "too-many",
    "too-long",
    "empty",
    "bad-id",
    "bad-reference",
    "duplicate",
  ].join("|");
  const match = new RegExp(`^(${taggedCodes}):\\s*(.*)$`).exec(message);
  if (!match) {
    return undefined;
  }
  return { code: match[1] as ChartIssueCode, message: match[2] };
}

function translateIssue(
  issue: z.ZodError["issues"][number],
  input: unknown,
): ChartIssue[] {
  const path = normalizePath(issue.path);
  const tagged = issue.code === "custom" ? parseTaggedIssue(issue.message) : undefined;
  if (tagged) {
    return [{ ...tagged, path }];
  }
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => ({
      code: "unknown-field",
      message: `Unknown field: ${key}`,
      path: [...path, key],
    }));
  }
  if (issue.code === "invalid_type") {
    const value = readPath(input, issue.path);
    if (typeof value === "number" && !Number.isFinite(value)) {
      return [{ code: "not-finite", message: "Number must be finite", path }];
    }
    if (!hasPath(input, issue.path) && path.length > 0) {
      return [{ code: "missing-field", message: "Required field is missing", path }];
    }
    return [{ code: "invalid-type", message: issue.message, path }];
  }
  if (issue.code === "invalid_union" && !hasPath(input, issue.path)) {
    return [{ code: "missing-field", message: "Required field is missing", path }];
  }
  if (issue.code === "invalid_format" && path.at(-1) === "id") {
    return [{ code: "bad-id", message: issue.message, path }];
  }
  if (issue.code === "too_small") {
    return [{ code: "out-of-range", message: issue.message, path }];
  }
  return [{ code: "invalid-type", message: issue.message, path }];
}

function issueFor(
  code: ChartIssueCode,
  message: string,
  path: (string | number)[],
): ChartIssue {
  return { code, message, path };
}

export function validateChartSpec(
  input: unknown,
): { ok: true; spec: ChartSpec } | { ok: false; issues: ChartIssue[] } {
  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, "type")) {
      return {
        ok: false,
        issues: [issueFor("missing-field", "Required field is missing", ["type"])],
      };
    }
    if (
      typeof record.type !== "string" ||
      !chartTypes.some((type) => type === record.type)
    ) {
      return {
        ok: false,
        issues: [issueFor("invalid-type", "Unknown chart type", ["type"])],
      };
    }
  }

  const parsed = chartSpecSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, spec: parsed.data };
  }
  return {
    ok: false,
    issues: parsed.error.issues.flatMap((issue) => translateIssue(issue, input)),
  };
}

