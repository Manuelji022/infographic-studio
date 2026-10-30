import { z } from "zod";
import {
  chartSpecBaseShape,
  finiteNumberSchema,
  labelSchema,
} from "./common.ts";

const pictogramValueSchema = finiteNumberSchema.min(0, {
  error: "out-of-range: Pictogram value must not be negative",
});

export const pictogramSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("pictogram"),
    of: z.union([z.literal(10), z.literal(100)]),
    value: pictogramValueSchema,
    label: labelSchema,
    icon: z.enum(["person", "square", "circle"]),
  })
  .strict()
  .superRefine((spec, context) => {
    if (spec.value > spec.of) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "out-of-range: Pictogram value must not exceed of",
      });
    }
    const scale = spec.of === 10 ? 10 : 1;
    const scaledValue = spec.value * scale;
    if (Math.abs(scaledValue - Math.round(scaledValue)) > 1e-8) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "out-of-range: Pictogram value has too many decimals",
      });
    }
  });

export type PictogramSpec = z.infer<typeof pictogramSpecSchema>;
