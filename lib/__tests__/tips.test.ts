import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DAILY_TIPS,
  buildSavingsSummary,
  getDailyTip,
  getFinancialScore,
  getHabitInsight,
  getSavingsFallback,
  getScoreLevel,
  parseSavingsSuggestions,
} from "@/lib/tips"
import type { GoalWithProgress } from "@/hooks/use-goals"

const normalize = (s: string) => s.replace(/\s/g, " ")

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

describe("getScoreLevel", () => {
  it.each([
    [100, "Excelente"],
    [85, "Excelente"],
    [84, "Bom"],
    [70, "Bom"],
    [69, "Regular"],
    [50, "Regular"],
    [49, "Atenção"],
    [0, "Atenção"],
  ])("nota %s => %s", (score, level) => {
    expect(getScoreLevel(score)).toBe(level)
  })
})

describe("getFinancialScore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-02T00:00:00Z")) // ~50% do prazo das metas
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("sem nenhum dado => null", () => {
    expect(getFinancialScore({ savingsRate: null, budgets: [], goals: [] })).toBeNull()
  })

  it("só poupança: 20% ou mais já dá a nota máxima", () => {
    expect(getFinancialScore({ savingsRate: 20, budgets: [], goals: [] })?.score).toBe(100)
    expect(getFinancialScore({ savingsRate: 50, budgets: [], goals: [] })?.score).toBe(100)
  })

  it("poupança proporcional abaixo de 20%", () => {
    expect(getFinancialScore({ savingsRate: 10, budgets: [], goals: [] })?.score).toBe(50)
  })

  it("poupança negativa não gera nota negativa", () => {
    const result = getFinancialScore({ savingsRate: -30, budgets: [], goals: [] })
    expect(result?.score).toBe(0)
    expect(result?.level).toBe("Atenção")
    expect(result?.highlights).toEqual(["Suas despesas superaram as receitas."])
  })

  it("combina as três partes com seus pesos (40/30/30)", () => {
    const result = getFinancialScore({
      savingsRate: 20, // 40 de 40
      budgets: [{ status: "normal" }, { status: "excedido" }], // média 0,5 => 15 de 30
      goals: [goal({ current_amount: 100 })], // atrasada => 0 de 30
    })
    expect(result?.score).toBe(55)
    expect(result?.level).toBe("Regular")
  })

  it("orçamento em atenção vale meio ponto", () => {
    const result = getFinancialScore({
      savingsRate: null,
      budgets: [{ status: "atencao" }],
      goals: [],
    })
    expect(result?.score).toBe(50)
  })

  it("meta no ritmo e meta concluída valem o máximo", () => {
    const result = getFinancialScore({
      savingsRate: null,
      budgets: [],
      goals: [goal({ current_amount: 450 }), goal({ id: "g2", current_amount: 1000 })],
    })
    expect(result?.score).toBe(100)
  })

  it("explica a nota em frases", () => {
    const result = getFinancialScore({
      savingsRate: 25,
      budgets: [{ status: "excedido" }, { status: "normal" }, { status: "normal" }],
      goals: [goal({ current_amount: 100 }), goal({ id: "g2", current_amount: 450 })],
    })
    expect(result?.highlights).toEqual([
      "Você guardou 25,0% da receita.",
      "1 de 3 orçamentos acima do limite.",
      "1 meta atrasada.",
    ])
  })

  it("frases quando está tudo certo", () => {
    const result = getFinancialScore({
      savingsRate: 30,
      budgets: [{ status: "normal" }],
      goals: [goal({ current_amount: 450 })],
    })
    expect(result?.highlights).toContain("Todos os orçamentos dentro do limite.")
    expect(result?.highlights).toContain("Nenhuma meta atrasada.")
  })
})

describe("getHabitInsight", () => {
  const cat = (id: string, total: number) => ({ id, name: `Cat ${id}`, total })

  it("destaca a categoria com maior alta em valor", () => {
    const insight = getHabitInsight(
      [cat("a", 123), cat("b", 400)],
      [cat("a", 100), cat("b", 300)],
      false
    )
    // a: +23% (R$ 23); b: +33% (R$ 100) => b tem a maior alta em valor
    expect(insight).toEqual({
      kind: "up",
      category: "Cat b",
      change: 33,
      comparison: "em relação ao mês anterior",
    })
  })

  it("usa o texto de período parcial quando o mês está em andamento", () => {
    const insight = getHabitInsight([cat("a", 150)], [cat("a", 100)], true)
    expect(insight?.comparison).toBe("em relação ao mesmo período do mês anterior")
  })

  it("ignora variações pequenas em percentual ou em valor", () => {
    // +5% (R$ 50): percentual baixo
    expect(getHabitInsight([cat("a", 1050)], [cat("a", 1000)], false)).toBeNull()
    // +50% mas só R$ 3: valor baixo
    expect(getHabitInsight([cat("a", 9)], [cat("a", 6)], false)).toBeNull()
  })

  it("sem alta, destaca a maior queda", () => {
    const insight = getHabitInsight([cat("a", 60)], [cat("a", 100)], false)
    expect(insight).toMatchObject({ kind: "down", category: "Cat a", change: 40 })
  })

  it("alta tem prioridade sobre queda", () => {
    const insight = getHabitInsight(
      [cat("a", 50), cat("b", 150)],
      [cat("a", 100), cat("b", 100)],
      false
    )
    expect(insight?.kind).toBe("up")
  })

  it("categoria nova (sem base anterior) é ignorada", () => {
    expect(getHabitInsight([cat("a", 500)], [], false)).toBeNull()
    expect(getHabitInsight([cat("a", 500)], [cat("a", 0)], false)).toBeNull()
  })
})

describe("buildSavingsSummary", () => {
  it("sem categorias => vazio (a consulta fica desligada)", () => {
    expect(buildSavingsSummary({ income: 100, expense: 0, categories: [] })).toBe("")
  })

  it("lista as categorias com valor e porcentagem", () => {
    const text = buildSavingsSummary({
      income: 3000,
      expense: 1000,
      categories: [
        { id: "a", name: "Alimentação", total: 750 },
        { id: "b", name: "Lazer", total: 250 },
      ],
    })
    expect(text).toBe(
      "Receitas: 3000.00; Despesas: 1000.00; Gastos por categoria: Alimentação: 750.00 (75%); Lazer: 250.00 (25%)"
    )
  })

  it("limita a 6 categorias", () => {
    const categories = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `C${i}`,
      total: 10,
    }))
    const text = buildSavingsSummary({ income: 0, expense: 100, categories })
    expect(text).toContain("C5")
    expect(text).not.toContain("C6")
  })
})

describe("getSavingsFallback", () => {
  it("sugere cortar 10% das categorias que mais pesam, no máximo 4", () => {
    const categories = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      name: `C${i}`,
      total: 1000 - i * 100,
    }))
    const result = getSavingsFallback(categories)
    expect(result).toHaveLength(4)
    expect(result[0].title).toBe("Reduzir 10% dos gastos com C0")
    expect(normalize(result[0].detail)).toBe("economia estimada de R$ 100,00")
  })

  it("ignora categorias sem gasto e lista vazia", () => {
    expect(getSavingsFallback([{ id: "a", name: "A", total: 0 }])).toEqual([])
    expect(getSavingsFallback([])).toEqual([])
  })
})

describe("parseSavingsSuggestions", () => {
  it("lê 'Título | detalhe'", () => {
    expect(parseSavingsSuggestions("Cancelar streaming | economia de R$ 40")).toEqual([
      { title: "Cancelar streaming", detail: "economia de R$ 40" },
    ])
  })

  it("ignora marcadores, numeração e negrito", () => {
    const result = parseSavingsSuggestions("1. **Levar marmita** | menos delivery\n- Trocar plano | R$ 30")
    expect(result).toEqual([
      { title: "Levar marmita", detail: "menos delivery" },
      { title: "Trocar plano", detail: "R$ 30" },
    ])
  })

  it("linha sem separador vira só título", () => {
    expect(parseSavingsSuggestions("Revise suas assinaturas")).toEqual([
      { title: "Revise suas assinaturas", detail: "" },
    ])
  })

  it("mantém barras extras no detalhe e limita a 4", () => {
    const text = Array.from({ length: 6 }, (_, i) => `T${i} | a | b`).join("\n")
    const result = parseSavingsSuggestions(text)
    expect(result).toHaveLength(4)
    expect(result[0].detail).toBe("a | b")
  })

  it("texto vazio => lista vazia", () => {
    expect(parseSavingsSuggestions("")).toEqual([])
    expect(parseSavingsSuggestions("\n  \n")).toEqual([])
  })
})

describe("getDailyTip", () => {
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h)

  it("é a mesma durante o dia inteiro", () => {
    expect(getDailyTip(at(2026, 10, 12, 0))).toBe(getDailyTip(at(2026, 10, 12, 23)))
  })

  it("troca no dia seguinte e dá a volta na lista", () => {
    const today = getDailyTip(at(2026, 10, 12))
    const tomorrow = getDailyTip(at(2026, 10, 13))
    expect(tomorrow).not.toBe(today)
    expect(getDailyTip(at(2026, 10, 12 + DAILY_TIPS.length))).toBe(today)
  })

  it("sempre devolve uma das dicas da lista", () => {
    expect(DAILY_TIPS).toContain(getDailyTip(at(2026, 1, 1)))
  })
})
