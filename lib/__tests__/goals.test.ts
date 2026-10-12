import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getGoalProgressPercentage, getGoalStatus, getGoalsSummary } from "@/lib/goals"
import type { GoalWithProgress } from "@/hooks/use-goals"

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

describe("getGoalStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("concluída quando atingiu o valor, mesmo sem prazo", () => {
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"))
    expect(getGoalStatus(goal({ current_amount: 1000, deadline: null }))).toBe("concluida")
    expect(getGoalStatus(goal({ current_amount: 1500 }))).toBe("concluida")
  })

  it("sem prazo quando falta deadline ou created_at", () => {
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"))
    expect(getGoalStatus(goal({ deadline: null }))).toBe("sem_prazo")
    expect(getGoalStatus(goal({ created_at: null }))).toBe("sem_prazo")
  })

  it("período de carência: meta nova nunca é atrasada", () => {
    vi.setSystemTime(new Date("2026-01-04T12:00:00Z")) // 3 dias de vida
    expect(getGoalStatus(goal({ current_amount: 0 }))).toBe("no_ritmo")
  })

  it("atrasada quando o progresso real está abaixo de 80% do esperado", () => {
    vi.setSystemTime(new Date("2026-07-02T00:00:00Z")) // ~50% do prazo
    expect(getGoalStatus(goal({ current_amount: 100 }))).toBe("atrasada")
  })

  it("no ritmo quando o progresso acompanha o esperado", () => {
    vi.setSystemTime(new Date("2026-07-02T00:00:00Z")) // ~50% do prazo
    expect(getGoalStatus(goal({ current_amount: 450 }))).toBe("no_ritmo")
  })

  it("prazo já vencido e meta não batida => atrasada", () => {
    vi.setSystemTime(new Date("2027-03-01T00:00:00Z"))
    expect(getGoalStatus(goal({ current_amount: 500 }))).toBe("atrasada")
  })
})

describe("getGoalProgressPercentage", () => {
  it("calcula a porcentagem", () => {
    expect(getGoalProgressPercentage(goal({ current_amount: 250 }))).toBe(25)
  })

  it("limita em 100", () => {
    expect(getGoalProgressPercentage(goal({ current_amount: 5000 }))).toBe(100)
  })

  it("alvo zero não divide por zero", () => {
    expect(getGoalProgressPercentage(goal({ target_amount: 0 }))).toBe(0)
  })
})

describe("getGoalsSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("lista vazia", () => {
    expect(getGoalsSummary([])).toEqual({
      totalSaved: 0,
      totalTarget: 0,
      overallPercentage: 0,
      activeCount: 0,
    })
  })

  it("soma valores e conta só as metas não concluídas como ativas", () => {
    const summary = getGoalsSummary([
      goal({ id: "1", target_amount: 1000, current_amount: 1000 }),
      goal({ id: "2", target_amount: 1000, current_amount: 500 }),
    ])
    expect(summary.totalSaved).toBe(1500)
    expect(summary.totalTarget).toBe(2000)
    expect(summary.overallPercentage).toBe(75)
    expect(summary.activeCount).toBe(1)
  })

  it("limita o percentual geral em 100", () => {
    const summary = getGoalsSummary([goal({ target_amount: 100, current_amount: 900 })])
    expect(summary.overallPercentage).toBe(100)
  })
})