import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { goalSchema } from "@/lib/schema/goals"

describe("goalSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Meio-dia local evita ambiguidade de fuso na hora de gerar o "hoje".
    vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const base = { name: "Viagem", target_amount: 1000 }

  it("aceita meta sem prazo", () => {
    expect(goalSchema.safeParse({ ...base, deadline: undefined }).success).toBe(true)
  })

  it("rejeita nome vazio ou longo demais", () => {
    expect(goalSchema.safeParse({ ...base, name: "" }).success).toBe(false)
    expect(goalSchema.safeParse({ ...base, name: "a".repeat(101) }).success).toBe(false)
  })

  it("rejeita valor zero ou negativo", () => {
    expect(goalSchema.safeParse({ ...base, target_amount: 0 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...base, target_amount: -5 }).success).toBe(false)
  })

  describe("no servidor (sem window)", () => {
    it("aceita prazo de hoje e de ontem", () => {
      expect(goalSchema.safeParse({ ...base, deadline: "2026-10-10" }).success).toBe(true)
      expect(goalSchema.safeParse({ ...base, deadline: "2026-10-09" }).success).toBe(true)
    })

    it("rejeita prazo de anteontem", () => {
      const result = goalSchema.safeParse({ ...base, deadline: "2026-10-08" })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.issues[0].path).toEqual(["deadline"])
    })
  })

  describe("no navegador (com window)", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {})
    })

    it("aceita hoje e o futuro", () => {
      expect(goalSchema.safeParse({ ...base, deadline: "2026-10-10" }).success).toBe(true)
      expect(goalSchema.safeParse({ ...base, deadline: "2027-01-01" }).success).toBe(true)
    })

    it("rejeita ontem", () => {
      expect(goalSchema.safeParse({ ...base, deadline: "2026-10-09" }).success).toBe(false)
    })
  })
})