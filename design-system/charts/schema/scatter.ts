import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  finiteNumberSchema,
  labelSchema,
} from "./common.ts";

const axisSchema = z
  .object({
    label: labelSchema,
    unit: labelSchema.optional(),
  })
  .strict();

const scatterPointSchema = z
  .object({
    label: labelSchema.optional(),
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    highlight: z.boolean().optional(),
  })
  .strict();

export const scatterSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("scatter"),
    x: axisSchema,
    y: axisSchema,
    points: boundedArray(scatterPointSchema, "Points", 1, 60),
  })
  .strict()
  .superRefine((spec, context) => {
    let labels = 0;
    const seen = new Set<string>();
    spec.points.forEach((point, index) => {
      if (point.label === undefined) {
        return;
      }
      labels++;
      if (point.highlight !== true) {
        context.addIssue({
          code: "custom",
          path: ["points", index, "label"],
          message: "invalid-type: Labels are only allowed on highlighted points",
        });
      }
      if (seen.has(point.label)) {
        context.addIssue({
          code: "custom",
          path: ["points", index, "label"],
          message: "duplicate: Point labels must be unique",
        });
      }
      seen.add(point.label);
    });
    if (labels > 8) {
      context.addIssue({
        code: "custom",
        path: ["points"],
        message: "too-many: At most eight points may have labels",
      });
    }
  });

export type ScatterSpec = z.infer<typeof scatterSpecSchema>;
