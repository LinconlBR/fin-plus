import { describe, expect, it } from "vitest"
import { planImport } from "@/lib/import-plan"
import { importPayloadSchema, MAX_IMPORT_ROWS } from "@/lib/schema/transaction-import"

const CAT_EXP = "11111111-1111-4111-8111-111111111111"
const CAT_INC = "22222222-2222-4222-8222-222222222222"
const categoryTypes = new Map<string, "income" | "expense">([[CAT_EXP, "expense"], [CAT_INC, "income"]])
const today = new Date(2026, 9, 12, 12)

const row = (over = {}) => ({
  date: "2026-10-01", description: "Mercado", amount: 50, type: "expense" as const, category_id: CAT_EXP, ...over,
})

describe("planImport", () => {
  it("aceita linhas válidas", () => {
    const plan = planImport({ rows: [row()], categoryTypes, existing: [], today })
    expect(plan).toEqual({ ok: true, toInsert: [row()], duplicates: 0 })
  })
  it("recusa categoria que não é da pessoa", () => {
    const plan = planImport({ rows: [row({ category_id: "33333333-3333-4333-8333-333333333333" })], categoryTypes, existing: [], today })
    expect(plan).toEqual({ ok: false, error: "Categoria inválida" })
  })
  it("recusa categoria de tipo diferente", () => {
    const plan = planImport({ rows: [row({ category_id: CAT_INC })], categoryTypes, existing: [], today })
    expect(plan.ok).toBe(false)
  })
  it("recusa datas fora da janela, com 1 dia de folga", () => {
    expect(planImport({ rows: [row({ date: "2026-07-11" })], categoryTypes, existing: [], today }).ok).toBe(true)
    expect(planImport({ rows: [row({ date: "2026-07-10" })], categoryTypes, existing: [], today }).ok).toBe(false)
    expect(planImport({ rows: [row({ date: "2026-10-13" })], categoryTypes, existing: [], today }).ok).toBe(true)
    expect(planImport({ rows: [row({ date: "2026-10-14" })], categoryTypes, existing: [], today }).ok).toBe(false)
  })
  it("pula duplicadas do banco e conta quantas", () => {
    const existing = [{ date: "2026-10-01", description: "MERCADO", amount: 50, type: "expense" as const }]
    const plan = planImport({ rows: [row(), row({ amount: 60 })], categoryTypes, existing, today })
    expect(plan).toMatchObject({ ok: true, duplicates: 1 })
    if (plan.ok) expect(plan.toInsert.map((r) => r.amount)).toEqual([60])
  })
  it("compras idênticas só são puladas até o limite do que já existe", () => {
    const existing = [{ date: "2026-10-01", description: "Mercado", amount: 50, type: "expense" as const }]
    const plan = planImport({ rows: [row(), row(), row()], categoryTypes, existing, today })
    expect(plan).toMatchObject({ ok: true, duplicates: 1 })
    if (plan.ok) expect(plan.toInsert).toHaveLength(2)
  })
})

describe("importPayloadSchema", () => {
  it("aceita linhas válidas", () => {
    expect(importPayloadSchema.safeParse([row()]).success).toBe(true)
  })
  it("recusa lista vazia e lista grande demais", () => {
    expect(importPayloadSchema.safeParse([]).success).toBe(false)
    expect(importPayloadSchema.safeParse(Array(MAX_IMPORT_ROWS + 1).fill(row())).success).toBe(false)
    expect(importPayloadSchema.safeParse(Array(MAX_IMPORT_ROWS).fill(row())).success).toBe(true)
  })
  it.each([
    { amount: 0 }, { amount: -5 }, { amount: 2e9 }, { description: "  " }, { description: "x".repeat(201) },
    { date: "01/10/2026" }, { type: "outro" }, { category_id: "abc" },
  ])("recusa linha inválida %j", (over) => {
    expect(importPayloadSchema.safeParse([row(over)]).success).toBe(false)
  })
  it("recusa o que não é lista", () => {
    expect(importPayloadSchema.safeParse({ date: "x" }).success).toBe(false)
    expect(importPayloadSchema.safeParse(null).success).toBe(false)
  })
})
