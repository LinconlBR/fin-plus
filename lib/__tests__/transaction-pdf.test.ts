import { describe, expect, it } from "vitest"
import { buildTransactionsPdf } from "@/lib/transaction-pdf"
import type { ExportTransaction } from "@/lib/transaction-export"

const make = (n: number): ExportTransaction[] =>
  Array.from({ length: n }, (_, i) => ({
    date: "2026-10-01",
    description: `Compra nº ${i} — açaí ção`,
    category: "Alimentação",
    type: i % 2 ? "income" : "expense",
    amount: 10 + i,
  }))

const isPdf = (buffer: ArrayBuffer) =>
  new TextDecoder().decode(new Uint8Array(buffer).slice(0, 5)) === "%PDF-"

describe("buildTransactionsPdf", () => {
  it("gera um PDF válido com acentos", () => {
    expect(isPdf(buildTransactionsPdf(make(3), { from: "2026-10-01", to: "2026-10-31" }))).toBe(true)
  })
  it("gera PDF mesmo sem transações", () => {
    expect(isPdf(buildTransactionsPdf([], { from: null, to: null }))).toBe(true)
  })
  it("cria várias páginas para listas grandes", () => {
    const small = buildTransactionsPdf(make(5), { from: null, to: null })
    const large = buildTransactionsPdf(make(300), { from: null, to: null })
    expect(large.byteLength).toBeGreaterThan(small.byteLength)
  })
})
