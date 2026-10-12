import { describe, expect, it } from "vitest"
import {
  DEFAULT_LAYOUT,
  WIDGET_IDS,
  buildDashboardRows,
  normalizeLayout,
  type WidgetPreference,
} from "@/lib/dashboard-layout"

const layout = (...entries: [WidgetPreference["id"], boolean][]): WidgetPreference[] =>
  entries.map(([id, visible]) => ({ id, visible }))

describe("normalizeLayout", () => {
  it.each([null, undefined, "texto", 42, {}, []])("devolve o padrão para %j", (saved) => {
    expect(normalizeLayout(saved)).toEqual(DEFAULT_LAYOUT)
  })

  it("respeita a ordem e a visibilidade salvas", () => {
    const saved = layout(["chart", true], ["cards", false], ["transactions", true], ["insights", true])
    expect(normalizeLayout(saved)).toEqual(saved)
  })

  it("acrescenta no fim, visíveis, os blocos que faltam", () => {
    const result = normalizeLayout(layout(["chart", false]))
    expect(result.map((w) => w.id)).toEqual(["chart", "cards", "insights", "transactions"])
    expect(result[0].visible).toBe(false)
    expect(result.slice(1).every((w) => w.visible)).toBe(true)
  })

  it("descarta blocos desconhecidos e entradas malformadas", () => {
    const result = normalizeLayout([
      { id: "inexistente", visible: true },
      { id: "cards", visible: "sim" },
      { id: "chart" },
      null,
      "cards",
      { id: "insights", visible: false },
    ])
    expect(result.find((w) => w.id === "insights")?.visible).toBe(false)
    expect(result.map((w) => w.id).sort()).toEqual([...WIDGET_IDS].sort())
  })

  it("mantém só a primeira ocorrência de um bloco repetido", () => {
    const result = normalizeLayout([
      { id: "cards", visible: false },
      { id: "cards", visible: true },
    ])
    expect(result.filter((w) => w.id === "cards")).toEqual([{ id: "cards", visible: false }])
  })

  it("não altera o padrão ao devolvê-lo (cópia independente)", () => {
    const result = normalizeLayout(null)
    result[0].visible = false
    expect(DEFAULT_LAYOUT[0].visible).toBe(true)
  })
})

describe("buildDashboardRows", () => {
  it("padrão: cards e insights sozinhos, gráfico e transações lado a lado", () => {
    expect(buildDashboardRows(DEFAULT_LAYOUT)).toEqual([
      ["cards"],
      ["insights"],
      ["chart", "transactions"],
    ])
  })

  it("mantém a ordem escolhida, inclusive o par invertido", () => {
    const rows = buildDashboardRows(
      layout(["transactions", true], ["chart", true], ["insights", true], ["cards", true])
    )
    expect(rows).toEqual([["transactions", "chart"], ["insights"], ["cards"]])
  })

  it("gráfico e transações separados ocupam a linha inteira", () => {
    const rows = buildDashboardRows(
      layout(["chart", true], ["cards", true], ["transactions", true], ["insights", true])
    )
    expect(rows).toEqual([["chart"], ["cards"], ["transactions"], ["insights"]])
  })

  it("ocultar o bloco do meio junta os vizinhos", () => {
    const rows = buildDashboardRows(
      layout(["chart", true], ["cards", false], ["transactions", true], ["insights", true])
    )
    expect(rows).toEqual([["chart", "transactions"], ["insights"]])
  })

  it("blocos ocultos não aparecem; tudo oculto => sem linhas", () => {
    expect(buildDashboardRows(layout(["cards", false], ["insights", false]))).toEqual([])
    expect(buildDashboardRows([])).toEqual([])
  })
})
