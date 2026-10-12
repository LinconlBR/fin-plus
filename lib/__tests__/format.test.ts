import { describe, expect, it } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDayMonth,
  formatPercent,
  formatPercentChange,
  formatPercentPoints,
  parseDateString,
} from "@/lib/format"

// O Intl usa espaço não-quebrável (U+00A0) entre "R$" e o número: normalizamos
// pra comparar com um espaço comum e o teste continuar legível.
const normalize = (s: string) => s.replace(/\s/g, " ")

describe("formatCurrency", () => {
  it("formata em reais por padrão", () => {
    expect(normalize(formatCurrency(1234.5))).toBe("R$ 1.234,50")
  })

  it("aceita string vinda do banco", () => {
    expect(normalize(formatCurrency("99.9"))).toBe("R$ 99,90")
  })

  it("formata zero e negativos", () => {
    expect(normalize(formatCurrency(0))).toBe("R$ 0,00")
    expect(normalize(formatCurrency(-10))).toBe("-R$ 10,00")
  })

  it("aceita outra moeda", () => {
    expect(normalize(formatCurrency(10, "EUR"))).toBe("€ 10,00")
  })
})

describe("formatPercent", () => {
  it("recebe a escala 0-100, não fração", () => {
    expect(formatPercent(49.9)).toBe("49,9%")
    expect(formatPercent(100)).toBe("100,0%")
  })

  it("aceita string", () => {
    expect(formatPercent("12.34")).toBe("12,3%")
  })
})

describe("formatPercentChange", () => {
  it("coloca sinal + em positivos e - em negativos", () => {
    expect(formatPercentChange(75)).toBe("+75,0%")
    expect(formatPercentChange(-8)).toBe("-8,0%")
  })

  it("não mostra sinal quando arredonda para zero", () => {
    expect(formatPercentChange(0)).toBe("0,0%")
    expect(formatPercentChange(0.04)).toBe("0,0%")
  })

  it("null vira traço", () => {
    expect(formatPercentChange(null)).toBe("—")
  })
})

describe("formatPercentPoints", () => {
  it("formata diferença em pontos percentuais", () => {
    expect(normalize(formatPercentPoints(13))).toBe("+13,0 p.p.")
    expect(normalize(formatPercentPoints(-2.5))).toBe("-2,5 p.p.")
  })

  it("null vira traço", () => {
    expect(formatPercentPoints(null)).toBe("—")
  })
})

describe("parseDateString", () => {
  it("monta a data local ao meio-dia, sem virar o dia por fuso", () => {
    const date = parseDateString("2026-10-10")
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(10)
    expect(date.getHours()).toBe(12)
  })

  it("ignora a parte de horário se vier um timestamp", () => {
    expect(parseDateString("2026-01-05T23:59:59Z").getDate()).toBe(5)
  })
})

describe("formatDate / formatDayMonth", () => {
  it("mostra o dia certo, independente do fuso", () => {
    expect(formatDate("2026-10-10")).toBe("10/10/2026")
    expect(formatDayMonth("2026-10-10")).toBe("10/10")
  })

  it("trata virada de mês e ano", () => {
    expect(formatDate("2026-01-01")).toBe("01/01/2026")
    expect(formatDate("2025-12-31")).toBe("31/12/2025")
  })
})