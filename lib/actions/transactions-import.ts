"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { importPayloadSchema } from "@/lib/schema/transaction-import"
import { planImport, type ExistingTransaction } from "@/lib/import-plan"

type ImportResult = { error: string } | { imported: number; duplicates: number }

const PAGE_SIZE = 1000

export async function importTransactions(input: unknown): Promise<ImportResult> {
  const parsed = importPayloadSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }
  const rows = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, type")
  if (categoriesError) return { error: "Erro ao buscar categorias" }
  const categoryTypes = new Map(
    (categories ?? []).map((c) => [c.id as string, c.type as "income" | "expense"])
  )

  // Só as transações do intervalo importado interessam para achar duplicadas.
  const dates = rows.map((r) => r.date).sort()
  const existing: ExistingTransaction[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("date, description, amount, type")
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1])
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) return { error: "Erro ao verificar duplicadas" }
    for (const t of data ?? []) {
      existing.push({
        date: t.date,
        description: t.description ?? "Sem descrição",
        amount: Number(t.amount),
        type: t.type,
      })
    }
    if (!data || data.length < PAGE_SIZE) break
  }

  const plan = planImport({ rows, categoryTypes, existing })
  if (!plan.ok) return { error: plan.error }

  if (plan.toInsert.length > 0) {
    const { error } = await supabase.from("transactions").insert(
      plan.toInsert.map((row) => ({ ...row, user_id: user.id }))
    )
    if (error) return { error: "Não foi possível salvar as transações" }
  }

  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  return { imported: plan.toInsert.length, duplicates: plan.duplicates }
}
