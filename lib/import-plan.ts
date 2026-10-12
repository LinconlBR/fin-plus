// Decide o que realmente vai para o banco numa importação. O cliente já
// mostrou uma prévia, mas o servidor não confia nela: confere categoria, tipo,
// janela de datas e duplicadas de novo.

import { duplicateKey, monthsAgo, IMPORT_MONTHS } from "@/lib/transaction-import"
import { toDateString } from "@/lib/reports"
import type { ImportPayloadRow } from "@/lib/schema/transaction-import"

export type ExistingTransaction = Pick<ImportPayloadRow, "date" | "description" | "amount" | "type">

export type ImportPlan =
  | { ok: true; toInsert: ImportPayloadRow[]; duplicates: number }
  | { ok: false; error: string }

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function planImport(input: {
  rows: ImportPayloadRow[]
  categoryTypes: Map<string, "income" | "expense">
  existing: ExistingTransaction[]
  today?: Date
}): ImportPlan {
  const today = input.today ?? new Date()

  // O servidor roda em UTC e a pessoa pode estar em outro fuso: ±1 dia de folga
  // para não recusar o "hoje" de quem importa à noite no Brasil ou na Espanha.
  const earliest = toDateString(addDays(new Date(monthsAgo(today, IMPORT_MONTHS) + "T12:00:00"), -1))
  const latest = toDateString(addDays(today, 1))

  for (const row of input.rows) {
    if (row.date < earliest || row.date > latest) {
      return { ok: false, error: "Há transações fora dos últimos 3 meses" }
    }
    const categoryType = input.categoryTypes.get(row.category_id)
    if (!categoryType) return { ok: false, error: "Categoria inválida" }
    // O tipo da transação sempre acompanha o da categoria (mesma regra do cadastro manual).
    if (categoryType !== row.type) {
      return { ok: false, error: "A categoria não combina com o tipo da transação" }
    }
  }

  const available = new Map<string, number>()
  for (const t of input.existing) {
    const key = duplicateKey(t)
    available.set(key, (available.get(key) ?? 0) + 1)
  }

  const toInsert: ImportPayloadRow[] = []
  let duplicates = 0
  for (const row of input.rows) {
    const key = duplicateKey(row)
    const left = available.get(key) ?? 0
    if (left > 0) {
      available.set(key, left - 1)
      duplicates++
    } else {
      toInsert.push(row)
    }
  }

  return { ok: true, toInsert, duplicates }
}
