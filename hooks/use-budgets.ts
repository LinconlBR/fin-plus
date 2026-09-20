"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getBudgetPeriodRange } from "@/lib/budgets"

type BudgetRow = {
  id: string
  category_id: string | null
  category: { name: string } | null
  target_amount: string | null
  period: "weekly" | "monthly" | null
  start_date: string
  end_date: string | null
  is_recurring: boolean
}

export type Budget = {
    id: string
    category_id: string | null
    category: string
    targetAmount: number
    period: "weekly" | "monthly" | null
    startDate: string
    endDate: string | null
    isRecurring: boolean
}

async function fetchBudgets(): Promise<Budget[]> {
    const supabase = createClient()

    const { data } = await supabase
        .from("budgets")
        .select("*, category:categories(name)")
        .order("start_date", { ascending: false })
        .throwOnError()

    if (!data) {
        throw new Error("Failed to fetch budgets")
    }

    return (data as BudgetRow[]).map((row) => ({
        id: row.id,
        category_id: row.category_id,
        category: row.category?.name || "",
        targetAmount: row.target_amount ? parseFloat(row.target_amount) : 0,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        isRecurring: row.is_recurring
    }))
}


export type BudgetWithSpent = Budget & { spent: number }

export async function fetchBudgetsWithSpent(): Promise<BudgetWithSpent[]> {
  const supabase = createClient()
  const budgets = await fetchBudgets()

  const { data: transactions} = await supabase
    .from("transactions")
    .select("category_id, amount, date")
    .eq("type", "expense")
    .throwOnError()

  return budgets.map((budget) => {
    if (!budget.period) return { ...budget, spent: 0 }

        const range = getBudgetPeriodRange({
            is_recurring: budget.isRecurring,
            period: budget.period,
            start_date: budget.startDate,
            end_date: budget.endDate,
        })

    if (!range) return { ...budget, spent: 0 }

    // budget.category_id !== null é a correção do furo de dado: sem essa
    // checagem explícita, um orçamento órfão (categoria apagada,
    // category_id = null) bateria com QUALQUER transação também órfã
    // (category_id = null), já que null === null é `true` em JavaScript —
    // somando gastos de categorias completamente diferentes por engano.
    const spent = (transactions ?? [])
      .filter(
        (t) =>
          budget.category_id !== null &&
          t.category_id === budget.category_id &&
          t.date >= range.start &&
          t.date <= range.end
      )
      .reduce((acc, t) => acc + Number(t.amount), 0)

    return { ...budget, spent }
  })
}

export function useBudgets() {
  return useQuery({
    // queryKey identifica essa busca de forma única no cache do TanStack Query —
    // é como uma "chave de dicionário". Se outro componente pedir a mesma
    // queryKey, o TanStack Query reaproveita o cache em vez de buscar de novo.
    queryKey: ["budgets"],
    queryFn: fetchBudgetsWithSpent,
  })
}
