import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  emphasisSchema,
  finiteNumberSchema,
  labelSchema,
} from "./common.ts";

const positiveValueSchema = finiteNumberSchema.positive({
  error: "out-of-range: Value must be greater than zero",
});

const donutPartSchema = z
  .object({
    label: labelSchema,
    value: positiveValueSchema,
    emphasis: emphasisSchema.optional(),
  })
  .strict();

const totalSchema = z
  .object({
    label: labelSchema,
    value: positiveValueSchema,
  })
  .strict();

export const donutSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("donut"),
    parts: boundedArray(donutPartSchema, "Donut parts", 2, 6),
    total: totalSchema.optional(),
  })
  .strict()
  .superRefine((spec, context) => {
    const labels = new Set<string>();
    spec.parts.forEach((part, index) => {
      if (labels.has(part.label)) {
        context.addIssue({
          code: "custom",
          path: ["parts", index, "label"],
          message: "duplicate: Donut labels must be unique",
        });
      }
      labels.add(part.label);
    });
    if (spec.total && labels.has(spec.total.label)) {
      context.addIssue({
        code: "custom",
        path: ["total", "label"],
        message: "duplicate: Total label must differ from part labels",
      });
    }
  });

export type DonutSpec = z.infer<typeof donutSpecSchema>;
