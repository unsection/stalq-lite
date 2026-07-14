import { z } from "zod";

const selectorListSchema = z
  .union([z.array(z.string()), z.string()])
  .transform((value) => {
    if (Array.isArray(value)) {
      return value.map((item) => item.trim()).filter(Boolean);
    }
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  });

export const productInputSchema = z.object({
  ownProductId: z.string().uuid("Choose the product you are comparing against"),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Enter a valid URL"),
  useMainContentOnly: z.boolean().default(false),
  settleAnimations: z.boolean().default(false),
  includeSelectors: selectorListSchema.default([]),
  excludeSelectors: selectorListSchema.default([]),
  country: z.string().optional().nullable(),
  waitForMs: z.number().int().nullable().optional(),
  timeoutEnabled: z.boolean().default(false),
  timeoutMs: z.number().int().nullable().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productInputSchema.partial();

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleSettingsSchema = z
  .object({
    enabled: z.boolean(),
    frequency: z.union([z.literal(1), z.literal(2)]),
    primaryTime: z.string().regex(timePattern, "Use HH:mm format"),
    secondaryTime: z.string().regex(timePattern, "Use HH:mm format").nullable().optional(),
    timezone: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === 2 && !data.secondaryTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Secondary time is required when running twice daily",
        path: ["secondaryTime"],
      });
    }
  });

export type ScheduleSettingsInput = z.infer<typeof scheduleSettingsSchema>;

export const ownProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value && value.trim() ? value.trim() : null)),
  url: z
    .union([z.literal(""), z.string().url("Enter a valid URL")])
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  price: z.number().positive("Price must be greater than 0"),
  costPerUnit: z.number().min(0).optional(),
  marketplaceFeePercent: z.number().min(0).max(100).optional(),
  shippingCostPerUnit: z.number().min(0).optional(),
  targetMarginPercent: z.number().min(0).max(100).optional(),
});

export type OwnProductInput = z.infer<typeof ownProductInputSchema>;

export const ownProductUpdateSchema = ownProductInputSchema.partial();
