import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getBudgetsAtRisk, getGoalsHighlights, getSpendingPace } from "@/lib/dashboard-widgets"
import type { GoalWithProgress } from "@/hooks/use-goals"

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12)

describe("getSpendingPace", () => {
  it("mês em andamento: média diária e projeção até o fim do mês", () => {
    // 10 dias de outubro (31 dias) com R$ 500 gastos
    const pace = getSpendingPace({ spent: 500, previousSpent: 1000, month: "2026-10", today: at(2026, 10, 10) })
    expect(pace.daysElapsed).toBe(10)
    expect(pace.daysInMonth).toBe(31)
    expect(pace.dailyAverage).toBe(50)
    expect(pace.projected).toBe(1550)
    expect(pace.isComplete).toBe(false)
    expect(pace.change).toBeCloseTo(55)
  })

  it("mês encerrado: projeção é o total gasto e a média usa o mês todo", () => {
    const pace = getSpendingPace({ spent: 900, previousSpent: 600, month: "2026-09", today: at(2026, 10, 12) })
    expect(pace.isComplete).toBe(true)
    expect(pace.daysElapsed).toBe(30)
    expect(pace.dailyAverage).toBe(30)
    expect(pace.projected).toBe(900)
    expect(pace.reliable).toBe(true)
    expect(pace.change).toBe(50)
  })

  it("fevereiro bissexto tem 29 dias", () => {
    const pace = getSpendingPace({ spent: 0, previousSpent: 0, month: "2028-02", today: at(2028, 3, 5) })
    expect(pace.daysInMonth).toBe(29)
  })

  it("poucos dias de dados: projeção não é confiável", () => {
    const early = getSpendingPace({ spent: 100, previousSpent: 0, month: "2026-10", today: at(2026, 10, 3) })
    expect(early.reliable).toBe(false)
    const later = getSpendingPace({ spent: 100, previousSpent: 0, month: "2026-10", today: at(2026, 10, 5) })
    expect(later.reliable).toBe(true)
  })

  it("sem gasto no mês anterior, a variação é null", () => {
    const pace = getSpendingPace({ spent: 100, previousSpent: 0, month: "2026-10", today: at(2026, 10, 10) })
    expect(pace.change).toBeNull()
  })

  it("mês futuro não gera NaN nem divisão por zero", () => {
    const pace = getSpendingPace({ spent: 0, previousSpent: 0, month: "2027-01", today: at(2026, 10, 10) })
    expect(pace.daysElapsed).toBe(0)
    expect(pace.dailyAverage).toBe(0)
    expect(pace.projected).toBe(0)
  })
})

describe("getBudgetsAtRisk", () => {
  const budgets = [
    { category: "Casa", spent: 100, targetAmount: 1000 }, // 10% normal
    { category: "Lazer", spent: 150, targetAmount: 100 }, // 150% excedido
    { category: "Mercado", spent: 85, targetAmount: 100 }, // 85% atenção
    { category: "Transporte", spent: 100, targetAmount: 100 }, // 100% excedido
  ]

  it("devolve só estourados e em atenção, do mais comprometido ao menos", () => {
    const result = getBudgetsAtRisk(budgets)
    expect(result.map((b) => b.category)).toEqual(["Lazer", "Transporte", "Mercado"])
    expect(result.map((b) => b.status)).toEqual(["excedido", "excedido", "atencao"])
    expect(result[0].percentage).toBe(150)
  })

  it("respeita o limite", () => {
    expect(getBudgetsAtRisk(budgets, 2)).toHaveLength(2)
  })

  it("tudo dentro do limite => lista vazia", () => {
    expect(getBudgetsAtRisk([{ category: "Casa", spent: 10, targetAmount: 100 }])).toEqual([])
    expect(getBudgetsAtRisk([])).toEqual([])
  })

  it("orçamento de valor zero não gera NaN", () => {
    expect(getBudgetsAtRisk([{ category: "X", spent: 10, targetAmount: 0 }])).toEqual([])
  })
})

describe("getGoalsHighlights", () => {
  const goal = (over: Partial<GoalWithProgress> = {}): GoalWithProgress =>
    ({
      id: "g1",
      name: "Viagem",
      target_amount: 1000,
      current_amount: 0,
      deadline: "2026-12-31T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      ...over,
    }) as GoalWithProgress

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-02T00:00:00Z")) // ~50% do prazo
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("atrasadas primeiro, depois as mais perto de terminar", () => {
    const { highlights } = getGoalsHighlights([
      goal({ id: "a", name: "No ritmo 60%", current_amount: 600 }),
      goal({ id: "b", name: "Atrasada 10%", current_amount: 100 }),
      goal({ id: "c", name: "No ritmo 90%", current_amount: 900 }),
    ])
    expect(highlights.map((h) => h.id)).toEqual(["b", "c", "a"])
    expect(highlights[0].status).toBe("atrasada")
  })

  it("não lista metas concluídas, mas conta quantas são", () => {
    const result = getGoalsHighlights([
      goal({ id: "a", current_amount: 1000 }),
      goal({ id: "b", current_amount: 500 }),
    ])
    expect(result.highlights.map((h) => h.id)).toEqual(["b"])
    expect(result.completed).toBe(1)
    expect(result.total).toBe(2)
  })

  it("respeita o limite de itens", () => {
    const goals = Array.from({ length: 5 }, (_, i) => goal({ id: String(i), current_amount: 500 }))
    expect(getGoalsHighlights(goals, 2).highlights).toHaveLength(2)
  })

  it("calcula a porcentagem de cada meta", () => {
    const { highlights } = getGoalsHighlights([goal({ current_amount: 250 })])
    expect(highlights[0].percentage).toBe(25)
  })

  it("sem metas", () => {
    expect(getGoalsHighlights([])).toEqual({ highlights: [], completed: 0, total: 0 })
  })
})
