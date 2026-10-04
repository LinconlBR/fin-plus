import {
  buildOverviewSummaryText,
  calculateBalanceProjection,
  filterByDate,
  getFlowMonthsCount,
  getOverviewInsight,
  getPeriodRangeStrings,
  getPreviousPeriodRangeStrings,
  groupByMonth,
  groupExpensesByCategory,
  summarizePeriod,
  type OverviewInsightInput,
  type ReportPeriod,
} from "@/lib/reports"
import { getGoalsSummary } from "@/lib/goals"
import type { GoalWithProgress } from "@/hooks/use-goals"
import { createClient } from "@/lib/supabase/server"
import { KpiCards } from "@/components/reports/overview/kpi-cards"
import { OverviewInsight } from "@/components/reports/overview/overview-insight"
import { CategorySnapshot } from "@/components/reports/overview/category-snapshot"
import { FlowSnapshot } from "@/components/reports/overview/flow-snapshot"
import { ProjectionSnapshot } from "@/components/reports/overview/projection-snapshot"
import { GoalsSnapshot } from "@/components/reports/overview/goals-snapshot"

type TransactionRow = {
  amount: number | string
  type: "income" | "expense"
  date: string
  category_id: string | null
  categories: { name: string; color: string | null } | null
}

type GoalRow = {
  id: string
  name: string
  target_amount: number | string
  deadline: string | null
  created_at: string | null
  user_id: string
}

type ContributionRow = { goal_id: string; amount: number | string }

// `today` existe só para poder testar com uma data fixa; em produção é sempre agora.
export async function OverviewContent({
  period,
  today = new Date(),
}: {
  period: ReportPeriod
  today?: Date
}) {
  const supabase = await createClient()

  // Uma carga só: as transações servem aos KPIs, à rosca, às barras e à projeção
  // (que precisa do saldo de sempre). Depois é filtrar em memória por data.
  const [transactionsResult, goalsResult, contributionsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type, date, category_id, categories(name, color)")
      .throwOnError(),
    supabase
      .from("goals")
      .select("id, name, target_amount, deadline, created_at, user_id")
      .throwOnError(),
    supabase.from("goal_contributions").select("goal_id, amount").throwOnError(),
  ])

  const transactions = (transactionsResult.data ?? []) as unknown as TransactionRow[]
  const goalRows = (goalsResult.data ?? []) as unknown as GoalRow[]
  const contributions = (contributionsResult.data ?? []) as unknown as ContributionRow[]

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Sem lançamentos ainda</p>
        <p className="text-sm text-muted-foreground">
          Registre transações para ver o resumo dos seus relatórios.
        </p>
      </div>
    )
  }

  const monthsCount = getFlowMonthsCount(period)
  const currentRange = getPeriodRangeStrings(period, today)
  const previousRange = getPreviousPeriodRangeStrings(period, today)

  // ---- KPIs e categorias (período atual x anterior) ----
  const currentRows = filterByDate(transactions, currentRange)
  const previousRows = filterByDate(transactions, previousRange)
  const currentSummary = summarizePeriod(currentRows, currentRange.start, currentRange.end)
  const previousSummary = summarizePeriod(previousRows, previousRange.start, previousRange.end)
  const categories = groupExpensesByCategory(
    currentRows.filter((row) => row.type === "expense")
  )

  // ---- Barras (os mesmos 6 ou 12 meses da tela de Receitas vs despesas) ----
  const flow = groupByMonth(transactions, monthsCount, today)

  // ---- Projeção (saldo de sempre + média dos últimos 3 meses) ----
  const currentBalance = transactions.reduce(
    (acc, t) => (t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)),
    0
  )
  const projection = calculateBalanceProjection(
    currentBalance,
    groupByMonth(transactions, 3, today),
    monthsCount
  )

  // ---- Metas (estado de hoje: não existe "metas do mês passado") ----
  const savedByGoal = new Map<string, number>()
  for (const c of contributions) {
    savedByGoal.set(c.goal_id, (savedByGoal.get(c.goal_id) ?? 0) + Number(c.amount))
  }
  const goals: GoalWithProgress[] = goalRows.map((g) => {
    const target = Number(g.target_amount)
    const saved = savedByGoal.get(g.id) ?? 0
    return {
      id: g.id,
      name: g.name,
      target_amount: target,
      deadline: g.deadline,
      created_at: g.created_at,
      user_id: g.user_id,
      current_amount: saved,
      progress: target === 0 ? 0 : saved / target,
    }
  })
  const goalsSummary = getGoalsSummary(goals)

  // ---- Insight ----
  const top = categories.items[0]
  const insightInput: OverviewInsightInput = {
    period,
    income: currentSummary.income,
    expense: currentSummary.expense,
    net: currentSummary.net,
    savingsRate: currentSummary.savingsRate,
    previousExpense: previousSummary.expense,
    topCategory: top ? { name: top.name, percentage: top.percentage } : null,
    goalsPercentage: goals.length > 0 ? goalsSummary.overallPercentage : null,
  }

  // Os links levam o período junto, para a tela completa abrir no mesmo Mês/Ano.
  const link = (route: string) => `${route}?period=${period}`

  return (
    <div className="space-y-4">
      <KpiCards
        current={currentSummary}
        previous={previousSummary}
        period={period}
        href={link("/reports/period-comparison")}
      />

      <OverviewInsight
        summary={buildOverviewSummaryText(insightInput)}
        fallback={getOverviewInsight(insightInput)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategorySnapshot
          items={categories.items}
          total={categories.total}
          href={link("/reports/categories")}
        />
        <FlowSnapshot
          data={flow}
          windowLabel={monthsCount === 12 ? "Últimos 12 meses" : "Últimos 6 meses"}
          href={link("/reports/income-vs-expense")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProjectionSnapshot projection={projection} href={link("/reports/balance-projection")} />
        <GoalsSnapshot
          summary={goalsSummary}
          hasGoals={goals.length > 0}
          href={link("/reports/goals-evolution")}
        />
      </div>
    </div>
  )
}