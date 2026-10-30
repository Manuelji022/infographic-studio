import { z } from "zod";
import {
  boundedArray,
  chartIdSchema,
  chartSpecBaseShape,
  chartToneSchema,
  emphasisSchema,
  finiteNumberSchema,
  labelSchema,
  textSchema,
} from "./common.ts";

const treemapItemSchema = z
  .object({
    label: labelSchema,
    value: finiteNumberSchema.positive({
      error: "out-of-range: Treemap values must be greater than zero",
    }),
    group: chartIdSchema.optional(),
    emphasis: emphasisSchema.optional(),
  })
  .strict();

const groupSchema = z
  .object({
    id: chartIdSchema,
    label: labelSchema,
    tone: chartToneSchema,
  })
  .strict();

const groupsSchema = z.array(groupSchema).superRefine((groups, context) => {
  if (groups.length === 0) {
    context.addIssue({ code: "custom", message: "empty: Groups must not be empty" });
  }
});

export const treemapSpecSchema = z
  .object({
    ...chartSpecBaseShape,
    type: z.literal("treemap"),
    items: boundedArray(treemapItemSchema, "Treemap items", 1, 30),
    groups: groupsSchema.optional(),
    period: textSchema(Number.MAX_SAFE_INTEGER, "Period").optional(),
  })
  .strict()
  .superRefine((spec, context) => {
    const groupIds = new Set<string>();
    const groupLabels = new Set<string>();
    spec.groups?.forEach((group, index) => {
      if (groupIds.has(group.id)) {
        context.addIssue({
          code: "custom",
          path: ["groups", index, "id"],
          message: "duplicate: Group IDs must be unique",
        });
      }
      if (groupLabels.has(group.label)) {
        context.addIssue({
          code: "custom",
          path: ["groups", index, "label"],
          message: "duplicate: Group labels must be unique",
        });
      }
      groupIds.add(group.id);
      groupLabels.add(group.label);
    });

    const itemLabels = new Set<string>();
    spec.items.forEach((item, index) => {
      if (itemLabels.has(item.label)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "label"],
          message: "duplicate: Treemap item labels must be unique",
        });
      }
      itemLabels.add(item.label);
      if (item.group !== undefined && !groupIds.has(item.group)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "group"],
          message: "bad-reference: Item group must exist in groups",
        });
      }
    });
  });

export type TreemapSpec = z.infer<typeof treemapSpecSchema>;
