// Regras da exportação de transações (CSV e PDF). Lógica pura; a busca no banco
// está em app/api/transactions/export/route.ts e o desenho do PDF em
// lib/transaction-pdf.ts.

import { toCsv } from "@/lib/csv"

export type ExportFormat = "csv" | "pdf"

export type ExportTransaction = {
  date: string // YYYY-MM-DD
  description: string
  category: string
  type: "income" | "expense"
  amount: number
}

export const CSV_HEADER = ["Data", "Descrição", "Categoria", "Tipo", "Valor"]

// Valor com vírgula decimal e sem milhar ("1234,56"): o Excel em português
// reconhece como número, e o importador do Fin+ lê de volta.
function formatCsvAmount(value: number): string {
  return value.toFixed(2).replace(".", ",")
}

export function transactionsToCsv(transactions: ExportTransaction[]): string {
  const rows: (string | number)[][] = [CSV_HEADER]
  for (const t of transactions) {
    rows.push([
      t.date,
      t.description,
      t.category,
      t.type === "income" ? "Receita" : "Despesa",
      formatCsvAmount(t.amount),
    ])
  }
  return toCsv(rows, ";")
}

export function summarizeTransactions(transactions: ExportTransaction[]) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === "income") income += t.amount
    else expense += t.amount
  }
  // Soma em centavos para o saldo não sair com 0,1 + 0,2 = 0,30000000000000004.
  const round = (n: number) => Math.round(n * 100) / 100
  return { income: round(income), expense: round(expense), balance: round(income - expense) }
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(y, m - 1, d, 12)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export type ExportParams =
  | { ok: true; format: ExportFormat; from: string | null; to: string | null }
  | { ok: false; error: string }

// A query string vem do navegador: nada dela é confiável.
export function parseExportParams(params: URLSearchParams): ExportParams {
  const format = params.get("format")
  if (format !== "csv" && format !== "pdf") return { ok: false, error: "Formato inválido" }

  const from = params.get("from") || null
  const to = params.get("to") || null
  if (from && !isValidDateString(from)) return { ok: false, error: "Data inicial inválida" }
  if (to && !isValidDateString(to)) return { ok: false, error: "Data final inválida" }
  if (from && to && from > to) {
    return { ok: false, error: "A data inicial não pode ser depois da final" }
  }
  return { ok: true, format, from, to }
}

export function exportFilename(format: ExportFormat, from: string | null, to: string | null): string {
  const range = from || to ? `${from ?? "inicio"}_a_${to ?? "hoje"}` : "todas"
  return `fin-plus-transacoes-${range}.${format}`
}
