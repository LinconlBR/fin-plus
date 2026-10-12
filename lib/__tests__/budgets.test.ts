import { describe, expect, it } from "vitest"
import {
  findBudgetAmountForMonth,
  getBudgetInsight,
  getBudgetStatus,
  intersectDateRanges,
} from "@/lib/budgets"

describe("getBudgetStatus", () => {
  it.each([
    [0, 100, "normal"],
    [79.99, 100, "normal"],
    [80, 100, "atencao"],
    [99.99, 100, "atencao"],
    [100, 100, "excedido"],
    [150, 100, "excedido"],
  ])("gasto %s de %s => %s", (spent, target, expected) => {
    expect(getBudgetStatus(spent, target)).toBe(expected)
  })

  it("orçamento com valor 0 não divide por zero", () => {
    expect(getBudgetStatus(50, 0)).toBe("normal")
  })
})

describe("getBudgetInsight", () => {
  it("lista vazia => texto vazio", () => {
    expect(getBudgetInsight([])).toBe("")
  })

  it("só estourados", () => {
    const text = getBudgetInsight([{ category: "Lazer", status: "excedido" }])
    expect(text).toContain("excedeu o orçamento de Lazer")
  })

  it("estourados e em atenção juntos", () => {
    const text = getBudgetInsight([
      { category: "Lazer", status: "excedido" },
      { category: "Mercado", status: "atencao" },
      { category: "Casa", status: "normal" },
    ])
    expect(text).toContain("excedeu o orçamento de Lazer")
    expect(text).toContain("próximo do limite em Mercado")
    expect(text).not.toContain("Casa")
  })

  it("junta várias categorias com vírgula", () => {
    const text = getBudgetInsight([
      { category: "A", status: "excedido" },
      { category: "B", status: "excedido" },
    ])
    expect(text).toContain("A, B")
  })

  it("só em atenção", () => {
    expect(getBudgetInsight([{ category: "Mercado", status: "atencao" }])).toContain(
      "próximo do limite em Mercado"
    )
  })

  it("tudo normal", () => {
    expect(getBudgetInsight([{ category: "Casa", status: "normal" }])).toContain(
      "dentro do limite em Casa"
    )
  })
})

describe("findBudgetAmountForMonth", () => {
  const history = [
    { budget_id: "a", period: "2026-01", amount: 100 },
    { budget_id: "a", period: "2026-04", amount: "250.50" },
    { budget_id: "b", period: "2026-02", amount: 999 },
  ]

  it("usa a entrada mais recente até o mês alvo", () => {
    expect(findBudgetAmountForMonth(history, "a", "2026-03")).toBe(100)
    expect(findBudgetAmountForMonth(history, "a", "2026-04")).toBe(250.5)
    expect(findBudgetAmountForMonth(history, "a", "2026-12")).toBe(250.5)
  })

  it("converte string em número", () => {
    expect(typeof findBudgetAmountForMonth(history, "a", "2026-05")).toBe("number")
  })

  it("null quando o orçamento ainda não existia", () => {
    expect(findBudgetAmountForMonth(history, "a", "2025-12")).toBeNull()
  })

  it("ignora entradas de outros orçamentos", () => {
    expect(findBudgetAmountForMonth(history, "b", "2026-12")).toBe(999)
    expect(findBudgetAmountForMonth(history, "x", "2026-12")).toBeNull()
  })

  it("não depende da ordem do histórico", () => {
    expect(findBudgetAmountForMonth([...history].reverse(), "a", "2026-05")).toBe(250.5)
  })
})

describe("intersectDateRanges", () => {
  it("intervalos sobrepostos", () => {
    expect(
      intersectDateRanges(
        { start: "2026-10-01", end: "2026-10-31" },
        { start: "2026-10-15", end: "2026-11-15" }
      )
    ).toEqual({ start: "2026-10-15", end: "2026-10-31" })
  })

  it("um dentro do outro", () => {
    expect(
      intersectDateRanges(
        { start: "2026-01-01", end: "2026-12-31" },
        { start: "2026-03-01", end: "2026-03-31" }
      )
    ).toEqual({ start: "2026-03-01", end: "2026-03-31" })
  })

  it("encostados no mesmo dia contam como interseção", () => {
    expect(
      intersectDateRanges(
        { start: "2026-10-01", end: "2026-10-10" },
        { start: "2026-10-10", end: "2026-10-20" }
      )
    ).toEqual({ start: "2026-10-10", end: "2026-10-10" })
  })

  it("disjuntos => null", () => {
    expect(
      intersectDateRanges(
        { start: "2026-01-01", end: "2026-01-31" },
        { start: "2026-02-01", end: "2026-02-28" }
      )
    ).toBeNull()
  })
})