import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  finiteNumberSchema,
  labelSchema,
  seriesNameSchema,
} from "./common.ts";

const columnSeriesSchema = z
  .object({
    name: seriesNameSchema,
    values: boundedArray(finiteNumberSchema, "Series values", 1, 12),
  })
  .strict();

export const columnSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("column"),
    categories: boundedArray(labelSchema, "Categories", 1, 12),
    series: boundedArray(columnSeriesSchema, "Series", 1, 4),
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
  });

export type ColumnSpec = z.infer<typeof columnSpecSchema>;
