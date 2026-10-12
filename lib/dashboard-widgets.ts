import { getGoalStatus, type GoalStatus } from "@/lib/goals"
import { getBudgetStatus } from "@/lib/budgets"
import { percentChange, toDateString } from "@/lib/reports"
import type { GoalWithProgress } from "@/hooks/use-goals"

// ---------- Ritmo de gastos ----------

export type SpendingPace = {
  daysElapsed: number
  daysInMonth: number
  dailyAverage: number
  // Mês em andamento: média diária x dias do mês. Mês encerrado: o total gasto.
  projected: number
  isComplete: boolean
  // Com poucos dias de dados a projeção oscila demais para ser levada a sério.
  reliable: boolean
  // Projeção contra o total do mês anterior; null se o mês anterior não teve gasto.
  change: number | null
}

const MIN_DAYS_FOR_RELIABLE_PACE = 5

// month = "YYYY-MM" visto no Dashboard; spent = despesas desse mês até hoje.
export function getSpendingPace(input: {
  spent: number
  previousSpent: number
  month: string
  today: Date
}): SpendingPace {
  const [year, m] = input.month.split("-").map(Number)
  const daysInMonth = new Date(year, m, 0).getDate()
  const currentMonth = toDateString(input.today).slice(0, 7)

  const isComplete = input.month < currentMonth
  const daysElapsed = isComplete
    ? daysInMonth
    : input.month === currentMonth
      ? input.today.getDate()
      : 0

  const dailyAverage = daysElapsed > 0 ? input.spent / daysElapsed : 0
  const projected = isComplete ? input.spent : dailyAverage * daysInMonth

  return {
    daysElapsed,
    daysInMonth,
    dailyAverage,
    projected,
    isComplete,
    reliable: isComplete || daysElapsed >= MIN_DAYS_FOR_RELIABLE_PACE,
    change: percentChange(projected, input.previousSpent),
  }
}

// ---------- Orçamentos em risco ----------

export type BudgetRisk = {
  category: string
  spent: number
  target: number
  // Gasto / valor do orçamento, em %, sem limite superior (estourou = acima de 100).
  percentage: number
  status: "atencao" | "excedido"
}

// Só os estourados e os perto do limite, do mais comprometido ao menos.
export function getBudgetsAtRisk(
  budgets: { category: string; spent: number; targetAmount: number }[],
  limit = 4
): BudgetRisk[] {
  return budgets
    .map((budget) => ({
      category: budget.category,
      spent: budget.spent,
      target: budget.targetAmount,
      percentage: budget.targetAmount === 0 ? 0 : (budget.spent / budget.targetAmount) * 100,
      status: getBudgetStatus(budget.spent, budget.targetAmount),
    }))
    .filter((budget): budget is BudgetRisk => budget.status !== "normal")
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit)
}

// ---------- Metas em andamento ----------

export type GoalHighlight = {
  id: string
  name: string
  saved: number
  target: number
  percentage: number
  status: GoalStatus
}

// Metas ainda não concluídas: as atrasadas primeiro (pedem atenção), depois as mais
// perto de terminar. Também devolve quantas já foram concluídas.
export function getGoalsHighlights(goals: GoalWithProgress[], limit = 3) {
  const completed = goals.filter((goal) => getGoalStatus(goal) === "concluida").length

  const highlights: GoalHighlight[] = goals
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      saved: goal.current_amount,
      target: goal.target_amount,
      percentage:
        goal.target_amount === 0
          ? 0
          : Math.min((goal.current_amount / goal.target_amount) * 100, 100),
      status: getGoalStatus(goal),
    }))
    .filter((goal) => goal.status !== "concluida")
    .sort((a, b) => {
      const lateA = a.status === "atrasada" ? 0 : 1
      const lateB = b.status === "atrasada" ? 0 : 1
      return lateA - lateB || b.percentage - a.percentage
    })
    .slice(0, limit)

  return { highlights, completed, total: goals.length }
}
