import {
  getFlowMonthsCount,
  getMonthsRangeStrings,
  groupGoalContributionsByMonth,
  type ReportPeriod,
} from "@/lib/reports"
import { type GoalWithProgress } from "@/hooks/use-goals"
import { createClient } from "@/lib/supabase/server"
import { GoalsTrendChart } from "@/components/reports/goals-evolution/goals-trend-chart"
import { GoalsProgressList } from "@/components/reports/goals-evolution/goals-progress-list"


type GoalRow = {
  id: string
  user_id: string
  name: string
  target_amount: number | string
  deadline: string | null
  created_at: string | null
}

export async function GoalsEvolutionContent({ period }: { period: ReportPeriod }) {
  const supabase = await createClient()
  const monthsCount = getFlowMonthsCount(period)
  const { start, end } = getMonthsRangeStrings(monthsCount)

  const goalsResult = await supabase
    .from("goals")
    .select("id, user_id, name, target_amount, deadline, created_at")
    .throwOnError()

  const goals = (goalsResult.data ?? []) as GoalRow[]
  const goalIds = goals.map((g) => g.id)

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Você ainda não tem metas</p>
        <p className="text-sm text-muted-foreground">
          Crie uma meta em Metas para acompanhar a evolução dela aqui.
        </p>
      </div>
    )
  }

  const [before, inWindow] = await Promise.all([
    supabase
      .from("goal_contributions")
      .select("goal_id, amount")
      .lt("date", start)
      .throwOnError(),
    supabase
      .from("goal_contributions")
      .select("goal_id, amount, date")
      .gte("date", start)
      .lte("date", end)
      .throwOnError(),
  ])

  const trend = groupGoalContributionsByMonth(
    before.data ?? [],
    inWindow.data ?? [],
    goalIds,
    monthsCount
  )

  // O total atual de cada meta é o valor acumulado no último ponto do
  // gráfico (o mês mais recente da janela) — mesmo dado que alimenta o
  // gráfico, sem precisar de uma terceira busca no banco.
  const lastPoint = trend[trend.length - 1]

  const goalsWithProgress: GoalWithProgress[] = goals.map((goal) => {
    const currentAmount = lastPoint?.values[goal.id] ?? 0
    const targetAmount = Number(goal.target_amount)
    return {
      id: goal.id,
      user_id: goal.user_id,
      name: goal.name,
      target_amount: targetAmount,
      deadline: goal.deadline,
      created_at: goal.created_at,
      current_amount: currentAmount,
      progress: targetAmount === 0 ? 0 : (currentAmount / targetAmount) * 100,
    }
  })

  const windowLabel = monthsCount === 12 ? "Últimos 12 meses" : "Últimos 6 meses"

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <GoalsTrendChart trend={trend} goals={goals} windowLabel={windowLabel} />
      <GoalsProgressList goals={goalsWithProgress} />
    </div>
  )
}