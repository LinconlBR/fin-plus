
export type  ReportPeriod = "month" | "year";

export type ExpenseRow = {
  amount: number | string
  category_id: string | null
  categories: { name: string; color: string | null } | null
}
export const changeToneClass = {
  good: "text-success",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
}

export type ChangeTone = "good" | "bad" | "neutral"

export function changeTone(change: number | null, higherIsBetter: boolean): ChangeTone {
  if (change === null || Math.abs(change) < 0.5) return "neutral"
  return (change > 0) === higherIsBetter ? "good" : "bad"
}


export function toDateString(date: Date): string {
    return date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");

}

export function getPeriodRange( period: ReportPeriod, date: Date): { start: Date, end: Date } {
    
    const start = new Date(date);
    start.setHours(0, 0, 0, 0)
    if (period === "month") {
        start.setDate(1);
    } else {
        start.setMonth(0);
        start.setDate(1);
    }
    const end = new Date(start);
    if (period === "month") {
        end.setMonth(end.getMonth() + 1);
    } else {
        end.setFullYear(end.getFullYear() + 1);
    }
    end.setDate(end.getDate() - 1);
    return { start, end };
}

export function getPreviousPeriodRange(period: ReportPeriod, date: Date): { start: Date, end: Date } {
    const currentPeriodRange = getPeriodRange(period, date);
    const previousPeriodEnd = new Date(currentPeriodRange.start);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    return getPeriodRange(period, previousPeriodEnd);
}

export function parsePeriod(value: string | string[] | undefined): ReportPeriod {
  return value === "year" ? "year" : "month"
}

export function getPeriodRangeStrings(period: ReportPeriod, date: Date = new Date()) {
  const { start, end } = getPeriodRange(period, date)
  return { start: toDateString(start), end: toDateString(end) }
}

export function getPreviousPeriodRangeStrings(period: ReportPeriod, date: Date = new Date()) {
  const { start, end } = getPreviousPeriodRange(period, date)
  return { start: toDateString(start), end: toDateString(end) }
}

export function percentChange(current: number, previous: number): number | null {
        if (previous === 0) return null;
        return ((current - previous) / previous) * 100;
}


export function groupExpensesByCategory(rows: ExpenseRow[]) {
    const groups = new Map<string, {
        id: string;
        name: string;
        color: string;
        total: number;
    }>();

    for (const row of rows) {
        const id = row.category_id ?? "uncategorized";
        const group = groups.get(id);
        const amount = Number(row.amount);

        if (group) {
            group.total += amount;
        } else {
            groups.set(id, {
                id,
                name: row.categories?.name ?? "Sem categoria",
                color: row.categories?.color ?? "#64748b",
                total: amount,
            });
        }
    }

    const total = [...groups.values()].reduce((sum, group) => sum + group.total, 0);
    const items = [...groups.values()]
        .sort((a, b) => b.total - a.total)
        .map((group) => ({
            ...group,
            percentage: total === 0 ? 0 : (group.total / total) * 100,
        }));

    return { items, total };
}

export type MonthlyFlow = {
  month: string
  label: string
  income: number
  expense: number
}


export function groupByMonth(rows: { amount: number | string; type: "income" | "expense"; date: string }[], monthsCount: number, referenceDate: Date = new Date()): MonthlyFlow[] {
    const monthlyMap = new Map<string, MonthlyFlow>();
    const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    for (let i = 0; i < monthsCount; i++) {
        const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);

        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

        monthlyMap.set(monthKey, {
            month: monthKey,
            label: `${monthLabels[date.getMonth()]}/${date.getFullYear()}`,
            income: 0,
            expense: 0,
        });
    }

    for (const row of rows) {
         const monthKey = row.date.slice(0, 7)

        const monthlyFlow = monthlyMap.get(monthKey);
        if (monthlyFlow) {
            if (row.type === "income") {
                monthlyFlow.income += Number(row.amount);
            } else {
                monthlyFlow.expense += Number(row.amount);
            }
        }
    }

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function getFlowMonthsCount(period: ReportPeriod): number {
  return period === "year" ? 12 : 6
}

export function getMonthsRangeStrings(monthsCount: number, referenceDate: Date = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (monthsCount - 1), 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
  return { start: toDateString(start), end: toDateString(end) }
}



export type PeriodSummary = {
  income: number
  expense: number
  net: number
  savingsRate: number
  weeklyAverageExpense: number
  transactionCount: number
}

export function summarizePeriod(rows: { amount: number | string; type: "income" | "expense" }[], start: string, end: string): PeriodSummary {
    
    const startDate = new Date(start)
    const endDate = new Date(end)
    const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    const weeks = Math.max(days / 7, 1) // mínimo de 1 semana, evita dividir por um período quase zero

    let income = 0;
    let expense = 0;
    let transactionCount = 0;

    for (const row of rows) {
        const amount = Number(row.amount);
        if (row.type === "income") {
            income += amount;
        } else {
            expense += amount;
        }
        transactionCount++;
    }

    const net = income - expense;
    const savingsRate = income === 0 ? 0 : (net / income) * 100;
    const weeklyAverageExpense = expense / weeks 

    return {
        income,
        expense,
        net,
        savingsRate,
        weeklyAverageExpense,
        transactionCount
    };
}


export type GoalTrendPoint = {
  month: string
  label: string
  values: Record<string, number> // goalId -> total acumulado até esse mês
}

export function groupGoalContributionsByMonth(
  contributionsBefore: { goal_id: string; amount: number | string }[],
  contributionsInWindow: { goal_id: string; amount: number | string; date: string }[],
  goalIds: string[],
  monthsCount: number,
  referenceDate: Date = new Date()
): GoalTrendPoint[] {
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const monthlyMap = new Map<string, { month: string; label: string }>()

  for (let i = 0; i < monthsCount; i++) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
    monthlyMap.set(monthKey, { month: monthKey, label: monthLabels[date.getMonth()] })
  }

  // O total corrente começa com o que já existia ANTES da janela, uma vez só.
  const runningTotal: Record<string, number> = {}
  for (const goalId of goalIds) runningTotal[goalId] = 0
  for (const contribution of contributionsBefore) {
    runningTotal[contribution.goal_id] = (runningTotal[contribution.goal_id] ?? 0) + Number(contribution.amount)
  }

  // Agrupa as contribuições DA JANELA por mês, pra não varrer a lista inteira a cada mês.
  const byMonth = new Map<string, typeof contributionsInWindow>()
  for (const contribution of contributionsInWindow) {
    const monthKey = contribution.date.slice(0, 7)
    const list = byMonth.get(monthKey) ?? []
    list.push(contribution)
    byMonth.set(monthKey, list)
  }

  // Do mais antigo pro mais recente: as chaves "YYYY-MM" ordenam certo como string.
  const orderedKeys = [...monthlyMap.keys()].sort()

  return orderedKeys.map((monthKey) => {
    for (const contribution of byMonth.get(monthKey) ?? []) {
      runningTotal[contribution.goal_id] =
        (runningTotal[contribution.goal_id] ?? 0) + Number(contribution.amount)
    }

    const { label } = monthlyMap.get(monthKey)!
    return { month: monthKey, label, values: { ...runningTotal } }
  })
}


export type BalanceProjection = {
  currentBalance: number
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  monthlyNet: number
  monthsAhead: number
  projectedBalance: number
  hasEnoughData: boolean
}

export function calculateBalanceProjection(
  currentBalance: number,
  recentMonths: MonthlyFlow[], // os últimos 3 meses, já vindos de groupByMonth
  monthsAhead: number
): BalanceProjection {

  const totalIncome = recentMonths.reduce((sum, month) => sum + month.income, 0)
  const totalExpense = recentMonths.reduce((sum, month) => sum + month.expense, 0)
  const divisor = recentMonths.length || 1
  const avgMonthlyIncome = totalIncome / divisor
  const avgMonthlyExpense = totalExpense / divisor
  const monthlyNet = avgMonthlyIncome - avgMonthlyExpense
  const projectedBalance = currentBalance + monthlyNet * monthsAhead
  const monthsWithMovement = recentMonths.filter(
    (month) => month.income > 0 || month.expense > 0
  ).length

  return {
    currentBalance,
    avgMonthlyIncome,
    avgMonthlyExpense,
    monthlyNet,
    monthsAhead,
    projectedBalance,
    hasEnoughData: monthsWithMovement >= 2,
  }


}

export type ProjectionPoint = {
  label: string
  actual: number | null
  projected: number | null
}

export function buildProjectionSeries(
  currentBalance: number,
  recentMonths: MonthlyFlow[], // últimos 3 meses, em ordem cronológica
  monthlyNet: number,
  monthsAhead: number
): ProjectionPoint[] {
  const actualBalances = new Array<number>(recentMonths.length)
  let runningBalance = currentBalance

  for (let index = recentMonths.length - 1; index >= 0; index--) {
    actualBalances[index] = runningBalance
    const month = recentMonths[index]
    runningBalance -= month.income - month.expense
  }

  const points: ProjectionPoint[] = recentMonths.map((month, index) => ({
    label: month.label,
    actual: actualBalances[index],
    projected: index === recentMonths.length - 1 ? actualBalances[index] : null,
  }))

  let projectedBalance = actualBalances[actualBalances.length - 1] ?? currentBalance
  for (let index = 1; index <= monthsAhead; index++) {
    projectedBalance += monthlyNet
    points.push({
      label: `+${index}`,
      actual: null,
      projected: projectedBalance,
    })
  }

  return points
}