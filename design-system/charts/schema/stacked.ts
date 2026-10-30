import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  finiteNumberSchema,
  labelSchema,
  seriesNameSchema,
} from "./common.ts";

const stackedValueSchema = finiteNumberSchema.superRefine((value, context) => {
  if (value < 0) {
    context.addIssue({
      code: "custom",
      message: "out-of-range: Stacked values must not be negative",
    });
  }
});

const stackedSeriesSchema = z
  .object({
    name: seriesNameSchema,
    values: boundedArray(stackedValueSchema, "Series values", 1, 60),
  })
  .strict();

export const stackedSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("stacked"),
    layout: z.enum(["columns", "bar"]),
    mode: z.enum(["absolute", "percent"]),
    categories: boundedArray(labelSchema, "Categories", 1, 60),
    series: boundedArray(stackedSeriesSchema, "Series", 2, 6),
  })
  .strict()
  .superRefine((spec, context) => {
    const names = new Set<string>();
    spec.categories.forEach((category, index) => {
      if (spec.categories.indexOf(category) !== index) {
        context.addIssue({
          code: "custom",
          path: ["categories", index],
          message: "duplicate: Category labels must be unique",
        });
      }
    });
    spec.series.forEach((series, index) => {
      if (series.values.length !== spec.categories.length) {
        context.addIssue({
          code: "custom",
          path: ["series", index, "values"],
          message: "length-mismatch: Series values must match categories",
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
    if (spec.layout === "bar" && spec.categories.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["categories"],
        message: "out-of-range: Bar layout requires exactly one category",
      });
    }
  });

export type StackedSpec = z.infer<typeof stackedSpecSchema>;
