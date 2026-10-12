import { z } from "zod"

export const MAX_RULES_PER_SAVE = 500

export const categoryRuleSchema = z.object({
  merchant_key: z.string().trim().min(1).max(60),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid(),
})

export const categoryRulesPayloadSchema = z.array(categoryRuleSchema).max(MAX_RULES_PER_SAVE)
