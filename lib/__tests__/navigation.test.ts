import { describe, expect, it } from "vitest"
import { getBreadcrumbs } from "@/lib/navigation"

describe("getBreadcrumbs", () => {
  it("página de primeiro nível", () => {
    expect(getBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard", href: "/dashboard" }])
  })

  it("página aninhada: cada item linka para o caminho acumulado", () => {
    expect(getBreadcrumbs("/reports/balance-projection")).toEqual([
      { label: "Relatórios", href: "/reports" },
      { label: "Projeção de saldo", href: "/reports/balance-projection" },
    ])
  })

  it("o mesmo segmento tem nomes diferentes conforme o caminho", () => {
    expect(getBreadcrumbs("/reports/categories").at(-1)?.label).toBe("Gastos por categoria")
    expect(getBreadcrumbs("/customize/categories").at(-1)?.label).toBe("Categorias")
  })

  it("segmento desconhecido usa o próprio texto da URL", () => {
    expect(getBreadcrumbs("/novidade")).toEqual([{ label: "novidade", href: "/novidade" }])
  })

  it("raiz e barras sobrando", () => {
    expect(getBreadcrumbs("/")).toEqual([])
    expect(getBreadcrumbs("/tips/")).toEqual([{ label: "Dicas financeiras", href: "/tips" }])
  })
})
