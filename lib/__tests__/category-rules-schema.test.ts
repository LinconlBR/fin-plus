import { describe, expect, it } from "vitest"
import { categoryRulesPayloadSchema, MAX_RULES_PER_SAVE } from "@/lib/schema/category-rules"

const rule = { merchant_key: "mercadona san", type: "expense", category_id: "11111111-1111-4111-8111-111111111111" }

describe("categoryRulesPayloadSchema", () => {
  it("aceita regras válidas e lista vazia", () => {
    expect(categoryRulesPayloadSchema.safeParse([rule]).success).toBe(true)
    expect(categoryRulesPayloadSchema.safeParse([]).success).toBe(true)
  })
  it("recusa lista grande demais", () => {
    expect(categoryRulesPayloadSchema.safeParse(Array(MAX_RULES_PER_SAVE + 1).fill(rule)).success).toBe(false)
  })
  it.each([{ merchant_key: "" }, { merchant_key: "x".repeat(61) }, { type: "outro" }, { category_id: "abc" }])(
    "recusa regra inválida %j",
    (over) => expect(categoryRulesPayloadSchema.safeParse([{ ...rule, ...over }]).success).toBe(false)
  )
  it("recusa o que não é lista", () => {
    expect(categoryRulesPayloadSchema.safeParse(null).success).toBe(false)
  })
})
