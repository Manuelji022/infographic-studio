import { z } from "zod";

export type ChartIssueCode =
  | "invalid-type"
  | "missing-field"
  | "unknown-field"
  | "not-finite"
  | "out-of-range"
  | "length-mismatch"
  | "too-many"
  | "too-long"
  | "empty"
  | "bad-id"
  | "bad-reference"
  | "duplicate";

export type ChartIssue = {
  code: ChartIssueCode;
  message: string;
  path: (string | number)[];
};

export type ChartType =
  | "line"
  | "column"
  | "stacked"
  | "donut"
  | "pictogram"
  | "scatter"
  | "ranking"
  | "treemap";

const forbiddenText =
  /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

export function textSchema(maxLength: number, name: string) {
  return z.string().superRefine((value, context) => {
    if (value.length === 0) {
      context.addIssue({
        code: "custom",
        message: `empty: ${name} must not be empty`,
      });
    }
    if (value.length > maxLength) {
      context.addIssue({
        code: "custom",
        message: `too-long: ${name} must be at most ${maxLength} characters`,
      });
    }
    if (forbiddenText.test(value)) {
      context.addIssue({
        code: "custom",
        message: `invalid-type: ${name} contains a control or bidi character`,
      });
    }
  });
}

export const labelSchema = textSchema(40, "Label");
export const emphasisSchema = z.enum(["highlight", "negative"]);
export type Emphasis = z.infer<typeof emphasisSchema>;
export const chartToneSchema = z.enum([
  "data-1",
  "data-2",
  "data-3",
  "data-4",
  "data-5",
  "data-6",
  "highlight",
  "negative",
  "neutral",
]);
export type ChartTone = z.infer<typeof chartToneSchema>;

const decimalSchema = z
  .number()
  .superRefine((value, context) => {
    if (value !== 0 && value !== 1 && value !== 2) {
      context.addIssue({
        code: "custom",
        message: "out-of-range: Decimals must be 0, 1, or 2",
      });
    }
  })
  .transform((value) => value as 0 | 1 | 2);

const unitFields = {
  decimals: decimalSchema.optional(),
  suffix: textSchema(12, "Unit suffix").optional(),
};

export const unitFormatSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("number"), ...unitFields }).strict(),
  z.object({ kind: z.literal("percent"), ...unitFields }).strict(),
  z
    .object({
      kind: z.literal("currency"),
      currency: z.enum(["EUR", "USD"]),
      ...unitFields,
    })
    .strict(),
]);
export type UnitFormat = z.infer<typeof unitFormatSchema>;

export const chartIdSchema = z.string().superRefine((value, context) => {
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(value)) {
    context.addIssue({
      code: "custom",
      message: "bad-id: ID must match ^[a-z][a-z0-9-]{0,31}$",
    });
  }
});

export const chartSpecBaseShape = {
  id: chartIdSchema,
  title: textSchema(120, "Title"),
  description: textSchema(280, "Description").optional(),
  unit: unitFormatSchema.optional(),
  sourceQuote: textSchema(500, "Source quote"),
  note: textSchema(200, "Note").optional(),
};

export const seriesNameSchema = labelSchema;
export const finiteNumberSchema = z.number().superRefine((value, context) => {
  if (Math.abs(value) > 1e15) {
    context.addIssue({
      code: "custom",
      message: "out-of-range: Numeric values must be at most 1e15 in magnitude",
    });
  }
});

export function boundedArray<T extends z.ZodType>(
  itemSchema: T,
  name: string,
  minLength: number,
  maxLength: number,
) {
  return z.array(itemSchema).superRefine((values, context) => {
    if (values.length === 0) {
      context.addIssue({
        code: "custom",
        message: `empty: ${name} must not be empty`,
      });
    } else if (values.length < minLength) {
      context.addIssue({
        code: "custom",
        message: `out-of-range: ${name} must contain at least ${minLength} entries`,
      });
    }
    if (values.length > maxLength) {
      context.addIssue({
        code: "custom",
        message: `too-many: ${name} must contain at most ${maxLength} entries`,
      });
    }
  });
}
