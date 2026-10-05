"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { findBudgetAmountForMonth, intersectDateRanges} from "@/lib/budgets"
import { getPeriodRangeStrings,toDateString } from "@/lib/reports"

// define o schema que vem da daatabase, que é diferente do schema que a gente quer usar na UI
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

// define o schema que a gente quer usar na UI, que é diferente do schema que vem da database
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

// busca os orçamentos do Supabase e transforma o schema da database para o schema que a gente quer usar na UI
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

// busca os orçamentos do Supabase, calcula o gasto de cada orçamento e transforma o schema da database para o schema que a gente quer usar na UI
export async function fetchBudgetsWithSpent(month?: string): Promise<BudgetWithSpent[]> {
  const supabase = createClient()
  const budgets = await fetchBudgets()

  const targetMonth = month ?? toDateString(new Date()).slice(0, 7)
  const [year, m] = targetMonth.split("-").map(Number)
  const referenceDate = new Date(year, m - 1, 1)
  const monthRange = getPeriodRangeStrings("month", referenceDate) // reaproveita de lib/reports.ts

  const { data: transactions } = await supabase
    .from("transactions")
    .select("category_id, amount, date")
    .eq("type", "expense")
    .throwOnError()

  const { data: history } = await supabase
    .from("budget_history")
    .select("budget_id, period, amount")
    .throwOnError()

  const results: BudgetWithSpent[] = []

  for (const budget of budgets) {
    if (!budget.period) continue

    let targetAmount: number
    let spendingRange: { start: string; end: string } | null

    if (budget.isRecurring) {
      // mensal ou semanal: os dois usam o histórico, só muda o multiplicador
      const historicalAmount = findBudgetAmountForMonth(history ?? [], budget.id, targetMonth)
      if (historicalAmount === null) continue // sem histórico nesse mês: esconde

      targetAmount = budget.period === "weekly" ? historicalAmount * 4 : historicalAmount
      spendingRange = monthRange
    } else {
      // único: não usa histórico, só cruza o range fixo com o mês navegado
      spendingRange = intersectDateRanges(monthRange, {
        start: budget.startDate,
        end: budget.endDate ?? budget.startDate,
      })
      if (!spendingRange) continue // não cruza esse mês: esconde

      targetAmount = budget.targetAmount
    }

    const spent = (transactions ?? [])
      .filter(
        (t) =>
          budget.category_id !== null &&
          t.category_id === budget.category_id &&
          t.date >= spendingRange.start &&
          t.date <= spendingRange.end
      )
      .reduce((acc, t) => acc + Number(t.amount), 0)

    results.push({ ...budget, targetAmount, spent })
  }

  return results
}
// hook tanstack query para buscar os orçamentos do Supabase, calcular o gasto de cada orçamento e transformar 
// o schema da database para o schema que a gente quer usar na UI
export function useBudgets(month?: string) {
  return useQuery({
    // queryKey identifica essa busca de forma única no cache do TanStack Query —
    // é como uma "chave de dicionário". Se outro componente pedir a mesma
    // queryKey, o TanStack Query reaproveita o cache em vez de buscar de novo.
    queryKey: ["budgets", month ?? "current"],
    // queryFn é a função que vai buscar os dados de fato. Ela pode ser assíncrona e retornar uma Promise.
    // O TanStack Query chama queryFn com o contexto da query, então precisamos
    // encapsular a função que já aceita um mês opcional para manter a assinatura correta.
    queryFn: () => fetchBudgetsWithSpent(month),
  })
}
