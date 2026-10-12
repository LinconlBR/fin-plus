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

// Busca as transações e monta a visão geral do mês (receitas, despesas, poupança,
// categoria que mais pesa). É a base dos insights do Dashboard e da página de Dicas.
export async function getMonthOverviewInput(month: string): Promise<OverviewInsightInput> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date, category_id, categories(name, color)")
    .throwOnError()
  const transactions = (data ?? []) as unknown as Row[]

  const { current, previous, partial } = getComparableRanges("month", monthToDate(month))
  const currentRows = filterByDate(transactions, current)
  const currentSummary = summarizePeriod(currentRows, current.start, current.end)
  const previousSummary = summarizePeriod(
    filterByDate(transactions, previous),
    previous.start,
    previous.end
  )
  const categories = groupExpensesByCategory(currentRows.filter((r) => r.type === "expense"))
  const top = categories.items[0]

  return {
    period: "month",
    periodName: partial ? null : formatMonthShort(month),
    income: currentSummary.income,
    expense: currentSummary.expense,
    net: currentSummary.net,
    savingsRate: currentSummary.savingsRate,
    previousExpense: previousSummary.expense,
    topCategory: top ? { name: top.name, percentage: top.percentage } : null,
    goalsPercentage: null,
  }
}
