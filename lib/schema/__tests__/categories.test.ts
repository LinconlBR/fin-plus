import { describe, expect, it } from "vitest"
import { categorySchema } from "@/lib/schema/categories"

const valid = { name: "Mercado", type: "expense", icon: "ShoppingCart", color: "#22c55e" }

describe("categorySchema", () => {
  it("aceita uma categoria válida", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true)
  })

  it("remove espaços do nome", () => {
    const result = categorySchema.parse({ ...valid, name: "  Mercado  " })
    expect(result.name).toBe("Mercado")
  })

  it.each(["", "   ", "a".repeat(61)])("rejeita nome inválido (%j)", (name) => {
    expect(categorySchema.safeParse({ ...valid, name }).success).toBe(false)
  })

  it("aceita nome com exatamente 60 caracteres", () => {
    expect(categorySchema.safeParse({ ...valid, name: "a".repeat(60) }).success).toBe(true)
  })

  it("rejeita tipo desconhecido", () => {
    expect(categorySchema.safeParse({ ...valid, type: "transfer" }).success).toBe(false)
  })

  it.each(["", "1Icon", "Icon-Name", "Icon Name", "A".repeat(41)])(
    "rejeita ícone inválido (%j)",
    (icon) => {
      expect(categorySchema.safeParse({ ...valid, icon }).success).toBe(false)
    }
  )

  it.each(["", "22c55e", "#22c55", "#22c55e0", "#gggggg", "red"])(
    "rejeita cor inválida (%j)",
    (color) => {
      expect(categorySchema.safeParse({ ...valid, color }).success).toBe(false)
    }
  )

  it("aceita cor hex maiúscula", () => {
    expect(categorySchema.safeParse({ ...valid, color: "#AABBCC" }).success).toBe(true)
  })
})