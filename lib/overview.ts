import { createClient } from "@/lib/supabase/server"
import {
  filterByDate,
  formatMonthShort,
  getComparableRanges,
  groupExpensesByCategory,
  monthToDate,
  summarizePeriod,
  type OverviewInsightInput,
} from "@/lib/reports"

type Row = {
  amount: number | string
  type: "income" | "expense"
  date: string
  category_id: string | null
  categories: { name: string; color: string | null } | null
}

export type CategoryTotal = { id: string; name: string; total: number; color: string }

export type MonthAnalysis = {
  input: OverviewInsightInput
  // Despesas por categoria, da maior para a menor, no período atual e no anterior
  // (do mesmo tamanho: se o mês está em andamento, compara até o mesmo dia).
  categories: CategoryTotal[]
  previousCategories: CategoryTotal[]
  // true quando o mês visto ainda está em andamento.
  partial: boolean
}

function toCategoryTotals(rows: Row[]): CategoryTotal[] {
  return groupExpensesByCategory(rows.filter((r) => r.type === "expense")).items.map(
    ({ id, name, total, color }) => ({ id, name, total, color })
  )
}

// Busca as transações uma vez e monta tudo que os insights do Dashboard e da
// página de Dicas precisam: visão geral, categorias do período e do anterior.
export async function getMonthAnalysis(month: string): Promise<MonthAnalysis> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date, category_id, categories(name, color)")
    .throwOnError()
  const transactions = (data ?? []) as unknown as Row[]

  const { current, previous, partial } = getComparableRanges("month", monthToDate(month))
  const currentRows = filterByDate(transactions, current)
  const previousRows = filterByDate(transactions, previous)
  const currentSummary = summarizePeriod(currentRows, current.start, current.end)
  const previousSummary = summarizePeriod(previousRows, previous.start, previous.end)

  const categories = toCategoryTotals(currentRows)
  const previousCategories = toCategoryTotals(previousRows)
  const top = groupExpensesByCategory(currentRows.filter((r) => r.type === "expense")).items[0]

  return {
    input: {
      period: "month",
      periodName: partial ? null : formatMonthShort(month),
      income: currentSummary.income,
      expense: currentSummary.expense,
      net: currentSummary.net,
      savingsRate: currentSummary.savingsRate,
      previousExpense: previousSummary.expense,
      topCategory: top ? { name: top.name, percentage: top.percentage } : null,
      goalsPercentage: null,
    },
    categories,
    previousCategories,
    partial,
  }
}

export async function getMonthOverviewInput(month: string): Promise<OverviewInsightInput> {
  return (await getMonthAnalysis(month)).input
}
