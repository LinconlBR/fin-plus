"use server"

import { createClient } from "@/lib/supabase/server"
import { budgetSchema } from "@/lib/schema/budgets"

// Toda action de escrita devolve { error } em caso de falha "esperada"
// (ex.: categoria duplicada) e undefined em caso de sucesso.
type ActionResult = { error?: string } | undefined

const DUPLICATE_MESSAGE = "Já existe um orçamento para essa categoria."

function parseBudgetForm(formData: FormData) {
  return budgetSchema.safeParse({
    category_id: formData.get("category_id"),
    target_amount: Number(formData.get("target_amount")),
    period: formData.get("period"),
    is_recurring: formData.get("is_recurring") === "true",
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date")?.toString(),
  })
}

export async function createBudget(formData: FormData): Promise<ActionResult> {
  const parsed = parseBudgetForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { category_id, target_amount, period, is_recurring, start_date, end_date } =
    parsed.data

  // O histórico do mês (budget_history) é gravado pelo trigger do banco.
  const { error } = await supabase.from("budgets").insert({
    category_id,
    target_amount,
    period,
    is_recurring,
    start_date: start_date ?? new Date().toISOString(), // TODO Branch 2: toDateString
    end_date: end_date ?? null,
    user_id: user.id,
  })

  if (error) {
    return { error: error.code === "23505" ? DUPLICATE_MESSAGE : error.message }
  }
}

export async function updateBudget(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseBudgetForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { category_id, target_amount, period, is_recurring, start_date, end_date } =
    parsed.data

  const { error } = await supabase
    .from("budgets")
    .update({
      category_id,
      target_amount,
      period,
      is_recurring,
      start_date: start_date ?? new Date().toISOString(), // TODO Branch 2: toDateString
      end_date: end_date ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.code === "23505" ? DUPLICATE_MESSAGE : error.message }
  }
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error("Erro ao deletar orçamento")
}