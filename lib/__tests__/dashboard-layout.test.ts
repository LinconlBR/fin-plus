import { describe, expect, it } from "vitest"
import {
  DASHBOARD_WIDGETS,
  DEFAULT_LAYOUT,
  WIDGET_IDS,
  buildDashboardRows,
  normalizeLayout,
  type WidgetId,
  type WidgetPreference,
} from "@/lib/dashboard-layout"

const layout = (...entries: [WidgetId, boolean][]): WidgetPreference[] =>
  entries.map(([id, visible]) => ({ id, visible }))

// Layout com todos os blocos, só com os indicados visíveis (na ordem dada) e o resto oculto.
const only = (...visible: WidgetId[]): WidgetPreference[] => [
  ...visible.map((id) => ({ id, visible: true })),
  ...WIDGET_IDS.filter((id) => !visible.includes(id)).map((id) => ({ id, visible: false })),
]

describe("DEFAULT_LAYOUT", () => {
  it("os 4 blocos originais ligados e os opcionais desligados", () => {
    const visible = DEFAULT_LAYOUT.filter((w) => w.visible).map((w) => w.id)
    expect(visible).toEqual(["cards", "insights", "chart", "transactions"])
    expect(DEFAULT_LAYOUT.filter((w) => !w.visible).length).toBeGreaterThanOrEqual(3)
  })

  it("segue a ordem e a visibilidade padrão de DASHBOARD_WIDGETS", () => {
    expect(DEFAULT_LAYOUT).toEqual(
      DASHBOARD_WIDGETS.map((w) => ({ id: w.id, visible: w.defaultVisible }))
    )
  })
})

describe("normalizeLayout", () => {
  it.each([null, undefined, "texto", 42, {}, []])("devolve o padrão para %j", (saved) => {
    expect(normalizeLayout(saved)).toEqual(DEFAULT_LAYOUT)
  })

  it("respeita a ordem e a visibilidade salvas", () => {
    const saved = [...DEFAULT_LAYOUT].reverse().map((w, i) => ({ ...w, visible: i % 2 === 0 }))
    expect(normalizeLayout(saved)).toEqual(saved)
  })

  it("blocos que faltam entram no fim com a visibilidade padrão (opcionais desligados)", () => {
    // Quem salvou o layout quando só existiam os 4 blocos originais.
    const result = normalizeLayout(
      layout(["chart", false], ["cards", true], ["insights", true], ["transactions", true])
    )
    expect(result.slice(0, 4).map((w) => w.id)).toEqual(["chart", "cards", "insights", "transactions"])
    expect(result[0].visible).toBe(false)

    const added = result.slice(4)
    expect(added.map((w) => w.id).sort()).toEqual(
      DASHBOARD_WIDGETS.filter((w) => !w.defaultVisible).map((w) => w.id).sort()
    )
    expect(added.every((w) => !w.visible)).toBe(true)
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
    expect(buildDashboardRows(only("transactions", "chart", "insights", "cards"))).toEqual([
      ["transactions", "chart"],
      ["insights"],
      ["cards"],
    ])
  })

  it("gráfico e transações separados ocupam a linha inteira", () => {
    expect(buildDashboardRows(only("chart", "cards", "transactions", "insights"))).toEqual([
      ["chart"],
      ["cards"],
      ["transactions"],
      ["insights"],
    ])
  })

  it("ocultar o bloco do meio junta os vizinhos", () => {
    expect(buildDashboardRows(only("chart", "transactions", "insights"))).toEqual([
      ["chart", "transactions"],
      ["insights"],
    ])
  })

  it("dois blocos pequenos vizinhos dividem a linha", () => {
    expect(buildDashboardRows(only("top-categories", "spending-pace"))).toEqual([
      ["top-categories", "spending-pace"],
    ])
  })

  it("três blocos pequenos: um par e um sozinho", () => {
    expect(
      buildDashboardRows(only("top-categories", "spending-pace", "goals-progress"))
    ).toEqual([["top-categories", "spending-pace"], ["goals-progress"]])
  })

  it("bloco pequeno não divide linha com gráfico, transações ou blocos de linha inteira", () => {
    expect(buildDashboardRows(only("chart", "top-categories"))).toEqual([["chart"], ["top-categories"]])
    expect(buildDashboardRows(only("cards", "goals-progress"))).toEqual([["cards"], ["goals-progress"]])
  })

  it("blocos ocultos não aparecem; tudo oculto => sem linhas", () => {
    expect(buildDashboardRows(layout(["cards", false], ["insights", false]))).toEqual([])
    expect(buildDashboardRows([])).toEqual([])
  })
})
