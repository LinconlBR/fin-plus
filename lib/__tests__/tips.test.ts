import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildTipsSummary, getGoalsFallbackTip, parseTipsReport } from "@/lib/tips"
import type { GoalWithProgress } from "@/hooks/use-goals"

describe("parseTipsReport", () => {
  it("lê uma dica por tema no formato 'Tema: dica'", () => {
    const tips = parseTipsReport(
      "Gastos: Reduza o delivery.\nOrçamentos: Revise o de Lazer.\nMetas: Aumente o aporte.\nEconomia: Guarde 10%."
    )
    expect(tips).toEqual([
      { topic: "Gastos", text: "Reduza o delivery." },
      { topic: "Orçamentos", text: "Revise o de Lazer." },
      { topic: "Metas", text: "Aumente o aporte." },
      { topic: "Economia", text: "Guarde 10%." },
    ])
  })

  it("ignora marcadores, numeração e negrito", () => {
    const tips = parseTipsReport("1. **Gastos**: corte supérfluos\n- Metas | aumente o aporte")
    expect(tips).toEqual([
      { topic: "Gastos", text: "corte supérfluos" },
      { topic: "Metas", text: "aumente o aporte" },
    ])
  })

  it("aceita tema sem acento e em outra caixa", () => {
    expect(parseTipsReport("orcamentos: revise")).toEqual([
      { topic: "Orçamentos", text: "revise" },
    ])
  })

  it("devolve na ordem dos temas, não na ordem da IA", () => {
    const tips = parseTipsReport("Economia: a\nGastos: b")
    expect(tips.map((t) => t.topic)).toEqual(["Gastos", "Economia"])
  })

  it("mantém só a primeira dica de um tema repetido", () => {
    const tips = parseTipsReport("Gastos: primeira\nGastos: segunda")
    expect(tips).toEqual([{ topic: "Gastos", text: "primeira" }])
  })

  it("mantém hífens dentro do texto da dica", () => {
    const tips = parseTipsReport("Gastos: corte gastos fixos - como assinaturas")
    expect(tips[0].text).toBe("corte gastos fixos - como assinaturas")
  })

  it("ignora temas desconhecidos, linhas soltas e texto vazio", () => {
    expect(parseTipsReport("Viagem: vá à praia\nolá, tudo bem?\n\n")).toEqual([])
    expect(parseTipsReport("")).toEqual([])
  })
})

describe("buildTipsSummary", () => {
  it("junta as partes com rótulos", () => {
    const text = buildTipsSummary({ overview: "ov", budgets: "bd", goals: "gl" })
    expect(text).toBe("Visão geral do mês: ov\nOrçamentos: bd\nMetas: gl")
  })

  it("deixa de fora as partes vazias", () => {
    expect(buildTipsSummary({ overview: "ov", budgets: "", goals: "" })).toBe(
      "Visão geral do mês: ov"
    )
  })

  it("tudo vazio => texto vazio (a consulta fica desligada)", () => {
    expect(buildTipsSummary({ overview: "", budgets: "", goals: "" })).toBe("")
  })
})

describe("getGoalsFallbackTip", () => {
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
    vi.setSystemTime(new Date("2026-07-02T00:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("sem metas => vazio", () => {
    expect(getGoalsFallbackTip([])).toBe("")
  })

  it("cita a meta atrasada", () => {
    expect(getGoalsFallbackTip([goal({ current_amount: 100 })])).toContain('"Viagem" está atrasada')
  })

  it("parabeniza quando tudo está concluído", () => {
    expect(getGoalsFallbackTip([goal({ current_amount: 1000 })])).toContain("Parabéns")
  })

  it("no ritmo", () => {
    expect(getGoalsFallbackTip([goal({ current_amount: 450 })])).toContain("no ritmo certo")
  })
})
