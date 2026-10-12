import { describe, expect, it } from "vitest"
import { dashboardLayoutSchema } from "@/lib/schema/dashboard-layout"
import { DEFAULT_LAYOUT } from "@/lib/dashboard-layout"

describe("dashboardLayoutSchema", () => {
  it("aceita o layout padrão", () => {
    expect(dashboardLayoutSchema.safeParse(DEFAULT_LAYOUT).success).toBe(true)
  })

  it("aceita outra ordem e blocos ocultos", () => {
    const reordered = [...DEFAULT_LAYOUT].reverse().map((w, i) => ({ ...w, visible: i % 2 === 0 }))
    expect(dashboardLayoutSchema.safeParse(reordered).success).toBe(true)
  })

  it("rejeita lista com blocos faltando ou sobrando", () => {
    expect(dashboardLayoutSchema.safeParse(DEFAULT_LAYOUT.slice(1)).success).toBe(false)
    expect(
      dashboardLayoutSchema.safeParse([...DEFAULT_LAYOUT, { id: "cards", visible: true }]).success
    ).toBe(false)
  })

  it("rejeita bloco repetido mesmo com o tamanho certo", () => {
    const repeated = DEFAULT_LAYOUT.map((w, i) => (i === 0 ? { ...w } : { ...DEFAULT_LAYOUT[0] }))
    expect(dashboardLayoutSchema.safeParse(repeated).success).toBe(false)
  })

  it("rejeita id desconhecido e visibilidade que não é booleano", () => {
    const unknown = DEFAULT_LAYOUT.map((w, i) => (i === 0 ? { id: "xss", visible: true } : w))
    expect(dashboardLayoutSchema.safeParse(unknown).success).toBe(false)

    const notBoolean = DEFAULT_LAYOUT.map((w, i) => (i === 0 ? { ...w, visible: "true" } : w))
    expect(dashboardLayoutSchema.safeParse(notBoolean).success).toBe(false)
  })

  it("rejeita o que não é lista", () => {
    expect(dashboardLayoutSchema.safeParse(null).success).toBe(false)
    expect(dashboardLayoutSchema.safeParse({}).success).toBe(false)
  })
})
