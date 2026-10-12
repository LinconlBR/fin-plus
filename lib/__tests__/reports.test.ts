import { describe, expect, it } from "vitest"
import {
  buildDailyBalanceSeries,
  buildOverviewSummaryText,
  calculateBalanceProjection,
  changeTone,
  clampMonth,
  filterByDate,
  formatMonthShort,
  getComparableRanges,
  getComparisonLabel,
  getMonthBounds,
  getOverviewInsight,
  getPeriodRangeStrings,
  getPreviousPeriodRangeStrings,
  getWeekRangeStrings,
  getWeekRangeWithinMonth,
  groupByMonth,
  groupExpensesByCategory,
  parseMonth,
  parsePeriod,
  parseWeek,
  percentChange,
  summarizePeriod,
  toDateString,
  type OverviewInsightInput,
} from "@/lib/reports"

// Todas as datas aqui são criadas com (ano, mês-1, dia, 12h) no horário local,
// o mesmo jeito que o app usa, então o resultado não depende do fuso da máquina.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12)

describe("percentChange", () => {
  it("calcula a variação", () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
  })

  it("sem base anterior => null", () => {
    expect(percentChange(100, 0)).toBeNull()
  })

  it("usa o valor absoluto da base (base negativa)", () => {
    expect(percentChange(-50, -100)).toBe(50)
  })
})

describe("changeTone", () => {
  it("null e variações minúsculas são neutras", () => {
    expect(changeTone(null, true)).toBe("neutral")
    expect(changeTone(0.4, true)).toBe("neutral")
    expect(changeTone(-0.4, false)).toBe("neutral")
  })

  it("quando mais é melhor (receita)", () => {
    expect(changeTone(10, true)).toBe("good")
    expect(changeTone(-10, true)).toBe("bad")
  })

  it("quando menos é melhor (despesa)", () => {
    expect(changeTone(10, false)).toBe("bad")
    expect(changeTone(-10, false)).toBe("good")
  })
})

describe("toDateString", () => {
  it("formata com zeros à esquerda", () => {
    expect(toDateString(at(2026, 3, 5))).toBe("2026-03-05")
  })
})

describe("períodos", () => {
  it("parsePeriod só aceita year, o resto vira month", () => {
    expect(parsePeriod("year")).toBe("year")
    expect(parsePeriod("month")).toBe("month")
    expect(parsePeriod("xyz")).toBe("month")
    expect(parsePeriod(undefined)).toBe("month")
    expect(parsePeriod(["year"])).toBe("month")
  })

  it("mês: do dia 1 ao último dia", () => {
    expect(getPeriodRangeStrings("month", at(2026, 10, 14))).toEqual({
      start: "2026-10-01",
      end: "2026-10-31",
    })
  })

  it("fevereiro de ano bissexto e não bissexto", () => {
    expect(getPeriodRangeStrings("month", at(2024, 2, 10)).end).toBe("2024-02-29")
    expect(getPeriodRangeStrings("month", at(2026, 2, 10)).end).toBe("2026-02-28")
  })

  it("ano: de 01/01 a 31/12", () => {
    expect(getPeriodRangeStrings("year", at(2026, 6, 15))).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    })
  })

  it("período anterior, inclusive na virada de ano", () => {
    expect(getPreviousPeriodRangeStrings("month", at(2026, 10, 14))).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    })
    expect(getPreviousPeriodRangeStrings("month", at(2026, 1, 10))).toEqual({
      start: "2025-12-01",
      end: "2025-12-31",
    })
    expect(getPreviousPeriodRangeStrings("year", at(2026, 6, 1))).toEqual({
      start: "2025-01-01",
      end: "2025-12-31",
    })
  })
})

describe("semana", () => {
  it("começa no domingo e termina no sábado", () => {
    // 14/10/2026 é uma quarta-feira
    expect(getWeekRangeStrings(at(2026, 10, 14))).toEqual({
      start: "2026-10-11",
      end: "2026-10-17",
    })
  })

  it("domingo é o início da própria semana", () => {
    expect(getWeekRangeStrings(at(2026, 10, 11)).start).toBe("2026-10-11")
  })

  it("semana que cruza o mês", () => {
    expect(getWeekRangeStrings(at(2026, 10, 1))).toEqual({
      start: "2026-09-27",
      end: "2026-10-03",
    })
  })

  it("getWeekRangeWithinMonth recorta a semana pelo mês", () => {
    expect(getWeekRangeWithinMonth("2026-09-27", "2026-10")).toEqual({
      start: "2026-10-01",
      end: "2026-10-03",
    })
    expect(getWeekRangeWithinMonth("2026-10-25", "2026-10")).toEqual({
      start: "2026-10-25",
      end: "2026-10-31",
    })
  })
})

describe("validação de parâmetros da URL", () => {
  it.each(["2026-01", "2026-12"])("parseMonth aceita %s", (value) => {
    expect(parseMonth(value)).toBe(value)
  })

  it.each(["2026-00", "2026-13", "26-10", "2026-1", "2026-10-01", "abc", ""])(
    "parseMonth rejeita %j",
    (value) => {
      expect(parseMonth(value)).toBeUndefined()
    }
  )

  it("parseMonth rejeita array e undefined", () => {
    expect(parseMonth(["2026-10"])).toBeUndefined()
    expect(parseMonth(undefined)).toBeUndefined()
  })

  it("parseWeek aceita data real", () => {
    expect(parseWeek("2026-10-11")).toBe("2026-10-11")
    expect(parseWeek("2024-02-29")).toBe("2024-02-29")
  })

  it.each(["2026-02-31", "2026-02-29", "2026-13-01", "2026-10", "abc"])(
    "parseWeek rejeita %j",
    (value) => {
      expect(parseWeek(value)).toBeUndefined()
    }
  )

  it("parseWeek rejeita array e undefined", () => {
    expect(parseWeek(["2026-10-11"])).toBeUndefined()
    expect(parseWeek(undefined)).toBeUndefined()
  })
})

describe("limites de mês", () => {
  it("clampMonth prende entre mínimo e máximo", () => {
    expect(clampMonth("2026-05", "2026-01", "2026-10")).toBe("2026-05")
    expect(clampMonth("2025-01", "2026-01", "2026-10")).toBe("2026-01")
    expect(clampMonth("2030-01", "2026-01", "2026-10")).toBe("2026-10")
  })

  it("getMonthBounds usa o mês da primeira transação", () => {
    expect(getMonthBounds("2026-03-15", at(2026, 10, 14))).toEqual({
      minMonth: "2026-03",
      maxMonth: "2026-10",
    })
  })

  it("sem transação, ou com transação futura, o mínimo é o mês atual", () => {
    const today = at(2026, 10, 14)
    expect(getMonthBounds(null, today)).toEqual({ minMonth: "2026-10", maxMonth: "2026-10" })
    expect(getMonthBounds(undefined, today)).toEqual({ minMonth: "2026-10", maxMonth: "2026-10" })
    expect(getMonthBounds("2027-01-01", today)).toEqual({ minMonth: "2026-10", maxMonth: "2026-10" })
  })

  it("formatMonthShort", () => {
    expect(formatMonthShort("2026-03")).toBe("Mar/2026")
    expect(formatMonthShort("2025-12")).toBe("Dez/2025")
  })
})

describe("getComparableRanges", () => {
  it("mês encerrado: mês inteiro contra o mês anterior inteiro", () => {
    expect(getComparableRanges("month", at(2026, 8, 1), at(2026, 10, 14))).toEqual({
      current: { start: "2026-08-01", end: "2026-08-31" },
      previous: { start: "2026-07-01", end: "2026-07-31" },
      partial: false,
    })
  })

  it("mês em andamento: do dia 1 até hoje contra o mesmo trecho do anterior", () => {
    expect(getComparableRanges("month", at(2026, 10, 1), at(2026, 10, 14))).toEqual({
      current: { start: "2026-10-01", end: "2026-10-14" },
      previous: { start: "2026-09-01", end: "2026-09-14" },
      partial: true,
    })
  })

  it("dia 31 contra mês de 30 dias usa o último dia do mês anterior", () => {
    const result = getComparableRanges("month", at(2026, 10, 1), at(2026, 10, 31))
    expect(result.previous.end).toBe("2026-09-30")
  })

  it("março vs fevereiro (não bissexto) no dia 30", () => {
    const result = getComparableRanges("month", at(2026, 3, 1), at(2026, 3, 30))
    expect(result.previous.end).toBe("2026-02-28")
  })

  it("ano em andamento: 01/01 até hoje contra o mesmo trecho do ano anterior", () => {
    expect(getComparableRanges("year", at(2026, 1, 1), at(2026, 10, 14))).toEqual({
      current: { start: "2026-01-01", end: "2026-10-14" },
      previous: { start: "2025-01-01", end: "2025-10-14" },
      partial: true,
    })
  })

  it("29/02 de ano bissexto contra ano anterior usa 28/02", () => {
    const result = getComparableRanges("year", at(2024, 1, 1), at(2024, 2, 29))
    expect(result.previous.end).toBe("2023-02-28")
  })

  it("getComparisonLabel", () => {
    expect(getComparisonLabel("month", false)).toBe("vs mês anterior")
    expect(getComparisonLabel("month", true)).toBe("vs mesmo período do mês anterior")
    expect(getComparisonLabel("year", false)).toBe("vs ano anterior")
    expect(getComparisonLabel("year", true)).toBe("vs mesmo período do ano anterior")
  })
})

describe("summarizePeriod", () => {
  const rows = [
    { amount: 1000, type: "income" as const },
    { amount: "200.50", type: "expense" as const },
    { amount: 300, type: "expense" as const },
  ]

  it("soma receitas, despesas e saldo", () => {
    const s = summarizePeriod(rows, "2026-10-01", "2026-10-31")
    expect(s.income).toBe(1000)
    expect(s.expense).toBe(500.5)
    expect(s.net).toBe(499.5)
    expect(s.transactionCount).toBe(3)
    expect(s.savingsRate).toBeCloseTo(49.95)
  })

  it("sem receita, a taxa de poupança é 0", () => {
    const s = summarizePeriod([{ amount: 50, type: "expense" }], "2026-10-01", "2026-10-31")
    expect(s.savingsRate).toBe(0)
  })

  it("média semanal usa no mínimo 1 semana", () => {
    const s = summarizePeriod([{ amount: 70, type: "expense" }], "2026-10-01", "2026-10-03")
    expect(s.weeklyAverageExpense).toBe(70)
  })

  it("média semanal de um período de 14 dias", () => {
    const s = summarizePeriod([{ amount: 140, type: "expense" }], "2026-10-01", "2026-10-14")
    expect(s.weeklyAverageExpense).toBe(70)
  })

  it("sem linhas, tudo zero", () => {
    expect(summarizePeriod([], "2026-10-01", "2026-10-31")).toMatchObject({
      income: 0,
      expense: 0,
      net: 0,
      transactionCount: 0,
    })
  })
})

describe("filterByDate", () => {
  const rows = [{ date: "2026-09-30" }, { date: "2026-10-01" }, { date: "2026-10-31" }, { date: "2026-11-01" }]

  it("intervalo inclusivo nas duas pontas", () => {
    expect(filterByDate(rows, { start: "2026-10-01", end: "2026-10-31" })).toEqual([
      { date: "2026-10-01" },
      { date: "2026-10-31" },
    ])
  })
})

describe("groupExpensesByCategory", () => {
  it("agrupa, ordena do maior para o menor e calcula porcentagem", () => {
    const { items, total } = groupExpensesByCategory([
      { amount: 30, category_id: "a", categories: { name: "Casa", color: "#111111" } },
      { amount: "70", category_id: "b", categories: { name: "Mercado", color: null } },
      { amount: 20, category_id: "a", categories: { name: "Casa", color: "#111111" } },
    ])
    expect(total).toBe(120)
    expect(items.map((i) => i.id)).toEqual(["b", "a"])
    expect(items[0].total).toBe(70)
    expect(items[1].total).toBe(50)
    expect(items[0].color).toBe("#64748b")
    expect(items[0].percentage + items[1].percentage).toBeCloseTo(100)
  })

  it("sem categoria vira 'Sem categoria'", () => {
    const { items } = groupExpensesByCategory([{ amount: 10, category_id: null, categories: null }])
    expect(items[0]).toMatchObject({ id: "uncategorized", name: "Sem categoria" })
  })

  it("lista vazia", () => {
    expect(groupExpensesByCategory([])).toEqual({ items: [], total: 0 })
  })
})

describe("groupByMonth", () => {
  it("cria todos os meses da janela, em ordem, mesmo sem movimento", () => {
    const result = groupByMonth([], 3, at(2026, 10, 14))
    expect(result.map((m) => m.month)).toEqual(["2026-08", "2026-09", "2026-10"])
    expect(result.map((m) => m.label)).toEqual(["Ago/2026", "Set/2026", "Out/2026"])
    expect(result.every((m) => m.income === 0 && m.expense === 0)).toBe(true)
  })

  it("soma receitas e despesas no mês certo e ignora o que está fora da janela", () => {
    const result = groupByMonth(
      [
        { amount: 100, type: "income", date: "2026-10-02" },
        { amount: "40", type: "expense", date: "2026-10-20" },
        { amount: 10, type: "expense", date: "2026-09-01" },
        { amount: 999, type: "income", date: "2020-01-01" },
      ],
      2,
      at(2026, 10, 14)
    )
    expect(result).toEqual([
      { month: "2026-09", label: "Set/2026", income: 0, expense: 10 },
      { month: "2026-10", label: "Out/2026", income: 100, expense: 40 },
    ])
  })

  it("janela que cruza o ano", () => {
    const result = groupByMonth([], 3, at(2026, 1, 15))
    expect(result.map((m) => m.month)).toEqual(["2025-11", "2025-12", "2026-01"])
  })
})

describe("calculateBalanceProjection", () => {
  const months = [
    { month: "2026-08", label: "Ago/2026", income: 3000, expense: 2000 },
    { month: "2026-09", label: "Set/2026", income: 3000, expense: 2400 },
    { month: "2026-10", label: "Out/2026", income: 3000, expense: 2600 },
  ]

  it("projeta com a média mensal", () => {
    const p = calculateBalanceProjection(1000, months, 2)
    expect(p.avgMonthlyIncome).toBe(3000)
    expect(p.avgMonthlyExpense).toBe(2333.3333333333335)
    expect(p.monthlyNet).toBeCloseTo(666.67, 1)
    expect(p.projectedBalance).toBeCloseTo(1000 + 666.67 * 2, 1)
    expect(p.hasEnoughData).toBe(true)
  })

  it("dados insuficientes com menos de 2 meses com movimento", () => {
    const p = calculateBalanceProjection(
      500,
      [
        { month: "a", label: "a", income: 0, expense: 0 },
        { month: "b", label: "b", income: 100, expense: 50 },
      ],
      3
    )
    expect(p.hasEnoughData).toBe(false)
  })

  it("lista vazia não gera NaN", () => {
    const p = calculateBalanceProjection(500, [], 3)
    expect(p.projectedBalance).toBe(500)
    expect(p.hasEnoughData).toBe(false)
  })
})

describe("buildDailyBalanceSeries", () => {
  it("carrega o saldo adiante nos dias sem transação", () => {
    const series = buildDailyBalanceSeries(
      { "2026-10-02": { net: 100, expense: 0 }, "2026-10-04": { net: -30, expense: 30 } },
      50,
      "2026-10-01",
      "2026-10-05",
      "2026-10-31"
    )
    expect(series.map((p) => p.currentBalance)).toEqual([50, 150, 150, 120, 120])
    expect(series.map((p) => p.expense)).toEqual([0, 0, 0, 30, 0])
  })

  it("nunca passa de hoje", () => {
    const series = buildDailyBalanceSeries({}, 0, "2026-10-01", "2026-10-31", "2026-10-03")
    expect(series.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"])
  })

  it("hoje antes do início => série vazia", () => {
    expect(buildDailyBalanceSeries({}, 0, "2026-10-10", "2026-10-31", "2026-10-01")).toEqual([])
  })
})

describe("insight da visão geral", () => {
  const base: OverviewInsightInput = {
    period: "month",
    income: 1000,
    expense: 500,
    net: 500,
    savingsRate: 50,
    previousExpense: 500,
    topCategory: null,
    goalsPercentage: null,
  }

  it("sem movimento => vazio", () => {
    const empty = { ...base, income: 0, expense: 0, net: 0 }
    expect(getOverviewInsight(empty)).toBe("")
    expect(buildOverviewSummaryText(empty)).toBe("")
  })

  it("saldo negativo tem prioridade e cita a categoria que mais pesa", () => {
    const text = getOverviewInsight({
      ...base,
      net: -100,
      expense: 1100,
      topCategory: { name: "Mercado", percentage: 40.4 },
    })
    expect(text).toContain("despesas superaram as receitas neste mês")
    expect(text).toContain("Mercado é a categoria que mais pesa (40% dos gastos)")
  })

  it("gastos subindo 10% ou mais", () => {
    const text = getOverviewInsight({ ...base, expense: 550, previousExpense: 500 })
    expect(text).toContain("gastos subiram 10%")
    expect(text).toContain("mês anterior")
  })

  it("no ano, fala em ano anterior e 'neste ano'", () => {
    expect(getOverviewInsight({ ...base, period: "year", expense: 600, previousExpense: 500 })).toContain(
      "ano anterior"
    )
    expect(getOverviewInsight({ ...base, period: "year" })).toContain("neste ano")
  })

  it("poupança boa", () => {
    expect(getOverviewInsight(base)).toContain("Bom ritmo, continue assim!")
  })

  it("poupança baixa sem elogio", () => {
    const text = getOverviewInsight({ ...base, savingsRate: 10, net: 100 })
    expect(text).toBe("Você guardou 10% da receita neste mês.")
  })

  it("usa o nome do período quando não é o atual", () => {
    expect(getOverviewInsight({ ...base, periodName: "Mar/2025" })).toContain("em Mar/2025")
  })

  it("resumo para a IA", () => {
    const text = buildOverviewSummaryText({
      ...base,
      expense: 600,
      net: 400,
      savingsRate: 40,
      previousExpense: 500,
      topCategory: { name: "Mercado", percentage: 50 },
      goalsPercentage: 25,
    })
    expect(text).toBe(
      "Período: mês; Receitas: 1000.00; Despesas: 600.00; Saldo do período: 400.00; " +
        "Taxa de poupança: 40%; Despesas vs período anterior: +20%; " +
        "Categoria que mais pesa: Mercado (50% das despesas); Progresso geral das metas: 25%"
    )
  })

  it("resumo sem período anterior", () => {
    expect(buildOverviewSummaryText({ ...base, previousExpense: 0 })).toContain(
      "sem dados anteriores"
    )
  })
})