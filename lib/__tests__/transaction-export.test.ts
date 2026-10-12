import { describe, expect, it } from "vitest"
import { parseCsv } from "@/lib/csv"
import {
  CSV_HEADER,
  exportFilename,
  parseExportParams,
  summarizeTransactions,
  transactionsToCsv,
  type ExportTransaction,
} from "@/lib/transaction-export"
import { buildImportRows, detectColumns } from "@/lib/transaction-import"

const sample: ExportTransaction[] = [
  { date: "2026-10-01", description: "Salário", category: "Trabalho", type: "income", amount: 5000 },
  { date: "2026-10-02", description: '=CMD("x"); mercado', category: "Mercado", type: "expense", amount: 120.5 },
]

describe("transactionsToCsv", () => {
  it("gera cabeçalho, tipo em português e vírgula decimal", () => {
    const rows = parseCsv(transactionsToCsv(sample))
    expect(rows[0]).toEqual(CSV_HEADER)
    expect(rows[1]).toEqual(["2026-10-01", "Salário", "Trabalho", "Receita", "5000,00"])
  })
  it("neutraliza fórmulas na descrição", () => {
    const rows = parseCsv(transactionsToCsv(sample))
    expect(rows[2][1]).toBe('\'=CMD("x"); mercado')
  })
  it("o que o Fin+ exporta, o Fin+ importa de volta", () => {
    const table = parseCsv(transactionsToCsv(sample))
    const mapping = detectColumns(table[0])
    const { rows, issues } = buildImportRows(table, 0, mapping)
    expect(issues).toEqual([])
    expect(rows.map((r) => [r.date, r.type, r.amount])).toEqual([
      ["2026-10-01", "income", 5000],
      ["2026-10-02", "expense", 120.5],
    ])
  })
})

describe("summarizeTransactions", () => {
  it("soma receitas, despesas e saldo sem erro de ponto flutuante", () => {
    const t = (type: "income" | "expense", amount: number): ExportTransaction => ({
      date: "2026-10-01", description: "x", category: "c", type, amount,
    })
    expect(summarizeTransactions([t("income", 0.3), t("expense", 0.1), t("expense", 0.1)])).toEqual({
      income: 0.3, expense: 0.2, balance: 0.1,
    })
  })
  it("devolve zeros para lista vazia", () => {
    expect(summarizeTransactions([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })
})

describe("parseExportParams", () => {
  const p = (q: string) => parseExportParams(new URLSearchParams(q))
  it("aceita formato e período válidos", () => {
    expect(p("format=csv&from=2026-01-01&to=2026-01-31")).toEqual({
      ok: true, format: "csv", from: "2026-01-01", to: "2026-01-31",
    })
  })
  it("período é opcional", () => {
    expect(p("format=pdf")).toEqual({ ok: true, format: "pdf", from: null, to: null })
  })
  it.each(["", "format=xls", "format=csv&from=2026-02-31", "format=csv&to=ontem", "format=csv&from=2026-02-01&to=2026-01-01"])(
    "rejeita %j",
    (q) => expect(p(q).ok).toBe(false)
  )
})

describe("exportFilename", () => {
  it("monta o nome pelo período", () => {
    expect(exportFilename("csv", "2026-01-01", "2026-01-31")).toBe("fin-plus-transacoes-2026-01-01_a_2026-01-31.csv")
    expect(exportFilename("pdf", null, null)).toBe("fin-plus-transacoes-todas.pdf")
    expect(exportFilename("pdf", "2026-01-01", null)).toBe("fin-plus-transacoes-2026-01-01_a_hoje.pdf")
  })
})
