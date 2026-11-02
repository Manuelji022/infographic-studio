import { z } from "zod";
import {
  boundedArray,
  chartSpecBaseShape,
  emphasisSchema,
  finiteNumberSchema,
  labelSchema,
} from "./common.ts";

const rankingItemSchema = z
  .object({
    label: labelSchema,
    value: finiteNumberSchema,
    emphasis: emphasisSchema.optional(),
  })
  .strict();

export const rankingSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("ranking"),
    items: boundedArray(rankingItemSchema, "Ranking items", 1, 15),
    order: z.enum(["desc", "asc"]),
  })
  .strict()
  .superRefine((spec, context) => {
    const labels = new Set<string>();
    spec.items.forEach((item, index) => {
      if (labels.has(item.label)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "label"],
          message: "duplicate: Ranking labels must be unique",
        });
      }
      labels.add(item.label);
    });
  });

export type RankingSpec = z.infer<typeof rankingSpecSchema>;
