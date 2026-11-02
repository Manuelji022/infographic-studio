import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  finiteNumberSchema,
  labelSchema,
  seriesNameSchema,
} from "./common.ts";

const xSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("year"),
      values: boundedArray(finiteNumberSchema, "X values", 1, 60),
    })
    .strict(),
  z
    .object({
      kind: z.literal("category"),
      values: boundedArray(labelSchema, "X values", 1, 60),
    })
    .strict(),
]);

const lineSeriesSchema = z
  .object({
    name: seriesNameSchema,
    values: boundedArray(
      finiteNumberSchema.nullable(),
      "Series values",
      1,
      60,
    ),
    projectedFrom: finiteNumberSchema.superRefine((value, context) => {
      if (!Number.isInteger(value) || value < 0) {
        context.addIssue({
          code: "custom",
          message: "out-of-range: projectedFrom must be a non-negative index",
        });
      }
    }).optional(),
  })
  .strict();

export const lineSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("line"),
    x: xSchema,
    series: boundedArray(lineSeriesSchema, "Series", 1, 4),
  })
  .strict()
  .superRefine((spec, context) => {
    const xLength = spec.x.values.length;
    const xValues = new Set<number | string>();
    spec.x.values.forEach((value, index) => {
      if (xValues.has(value)) {
        context.addIssue({
          code: "custom",
          path: ["x", "values", index],
          message: "duplicate: X values must be unique",
        });
      }
      xValues.add(value);
    });
    const names = new Set<string>();
    spec.series.forEach((series, index) => {
      if (series.values.length !== xLength) {
        context.addIssue({
          code: "custom",
          path: ["series", index, "values"],
          message: "length-mismatch: Series values must match x values",
        });
      }
      if (series.projectedFrom !== undefined && series.projectedFrom >= xLength) {
        context.addIssue({
          code: "custom",
          path: ["series", index, "projectedFrom"],
          message: "bad-reference: projectedFrom must reference an x value",
        });
      }
      if (names.has(series.name)) {
        context.addIssue({
          code: "custom",
          path: ["series", index, "name"],
          message: "duplicate: Series names must be unique",
        });
      }
      names.add(series.name);
    });
  });

export type LineSpec = z.infer<typeof lineSpecSchema>;
