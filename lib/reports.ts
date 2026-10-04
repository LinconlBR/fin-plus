
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

export function getWeekRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  const dayOfWeek = start.getDay() // 0 = domingo, 1 = segunda... 6 = sábado
  start.setDate(start.getDate() - dayOfWeek)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return { start, end }
}

export function getWeekRangeStrings(referenceDate: Date = new Date()) {
  const { start, end } = getWeekRange(referenceDate)
  return { start: toDateString(start), end: toDateString(end) }
}

// ---------- Validação do que vem da URL ----------

// Só aceita "YYYY-MM" com mês de 01 a 12. Qualquer outra coisa (inclusive array) vira undefined.
export function parseMonth(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined
}

// Só aceita "YYYY-MM-DD" que exista de verdade.
export function parseWeek(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [y, m, d] = value.split("-").map(Number)
  // O Date "rola" datas impossíveis (31/02 vira março): se ao converter de volta
  // o texto mudou, a data original não existia.
  return toDateString(new Date(y, m - 1, d)) === value ? value : undefined
}

// ---------- Limites de mês ----------

export function clampMonth(month: string, minMonth: string, maxMonth: string): string {
  if (month < minMonth) return minMonth
  if (month > maxMonth) return maxMonth
  return month
}

// Menor mês navegável = o da primeira transação (ou o mês atual, se não houver
// nenhuma ou se ela for futura). Maior mês navegável = o mês atual.
export function getMonthBounds(
  firstTransactionDate: string | null | undefined,
  today: Date = new Date()
): { minMonth: string; maxMonth: string } {
  const maxMonth = toDateString(today).slice(0, 7)
  const firstMonth = firstTransactionDate?.slice(0, 7)
  const minMonth = firstMonth && firstMonth < maxMonth ? firstMonth : maxMonth
  return { minMonth, maxMonth }
}

// ---------- Limites de semana ----------

// Domingos de todas as semanas que tocam o mês "YYYY-MM".
export function getMonthWeekStarts(month: string): string[] {
  const [year, m] = month.split("-").map(Number)
  const firstDay = new Date(year, m - 1, 1)
  const lastDay = new Date(year, m, 0)
  // Domingo da semana do dia 1 (o JS aceita dia zero/negativo e volta sozinho).
  const cursor = new Date(year, m - 1, 1 - firstDay.getDay())

  const starts: string[] = []
  while (cursor <= lastDay) {
    starts.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return starts
}

// Primeira e última semana navegáveis do mês. A última nunca passa da semana de hoje:
// no mês atual vale a semana atual, nos meses passados vale a última semana do mês.
export function getWeekBounds(
  month: string,
  today: Date = new Date()
): { minWeek: string; maxWeek: string } {
  const starts = getMonthWeekStarts(month)
  const currentSunday = getWeekRangeStrings(today).start
  const lastOfMonth = starts[starts.length - 1]
  return {
    minWeek: starts[0],
    maxWeek: lastOfMonth < currentSunday ? lastOfMonth : currentSunday,
  }
}

// Alinha a data ao domingo da semana dela e prende entre minWeek e maxWeek.
export function clampWeekToMonth(week: string, month: string, today: Date = new Date()): string {
  const [y, m, d] = week.split("-").map(Number)
  const sunday = getWeekRangeStrings(new Date(y, m - 1, d)).start
  const { minWeek, maxWeek } = getWeekBounds(month, today)
  if (sunday < minWeek) return minWeek
  if (sunday > maxWeek) return maxWeek
  return sunday
}

// A semana recortada pelo mês: só os dias que pertencem a ele.
// Ex.: semana 27/09–03/10 no mês 2026-10 vira 01/10–03/10.
export function getWeekRangeWithinMonth(
  week: string,
  month: string
): { start: string; end: string } {
  const [wy, wm, wd] = week.split("-").map(Number)
  const full = getWeekRangeStrings(new Date(wy, wm - 1, wd))
  const [y, m] = month.split("-").map(Number)
  const monthRange = getPeriodRangeStrings("month", new Date(y, m - 1, 1))
  return {
    start: full.start > monthRange.start ? full.start : monthRange.start,
    end: full.end < monthRange.end ? full.end : monthRange.end,
  }
}

// ---------- Série diária do gráfico do Dashboard ----------

export type DailyBalancePoint = {
  date: string
  currentBalance: number
  expense: number
}

// Um ponto por dia entre start e end, carregando o saldo adiante nos dias sem
// transação. Nunca passa de "hoje": dias que ainda não aconteceram não viram ponto.
export function buildDailyBalanceSeries(
  grouped: Record<string, { net: number; expense: number }>,
  initialBalance: number,
  start: string,
  end: string,
  today: string
): DailyBalancePoint[] {
  const lastDay = end < today ? end : today
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = lastDay.split("-").map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)

  const points: DailyBalancePoint[] = []
  let balance = initialBalance
  while (cursor <= last) {
    const day = toDateString(cursor)
    const values = grouped[day]
    if (values) balance += values.net
    points.push({ date: day, currentBalance: balance, expense: values?.expense ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return points
}

// ---------- Visão geral ----------

// Filtra linhas com campo `date` ("YYYY-MM-DD") dentro de um intervalo inclusivo.
// Strings nesse formato comparam direto, sem passar por Date.
export function filterByDate<T extends { date: string }>(
  rows: T[],
  range: { start: string; end: string }
): T[] {
  return rows.filter((row) => row.date >= range.start && row.date <= range.end)
}

export type OverviewInsightInput = {
  period: ReportPeriod
  income: number
  expense: number
  net: number
  savingsRate: number
  previousExpense: number
  topCategory: { name: string; percentage: number } | null
  goalsPercentage: number | null // null = o usuário ainda não tem metas
}

// Insight por regras: é o que aparece quando a IA falha ou ainda não respondeu.
// Uma frase só, escolhida por prioridade (o problema mais importante primeiro).
export function getOverviewInsight(input: OverviewInsightInput): string {
  if (input.income === 0 && input.expense === 0) return ""

  const when = input.period === "year" ? "neste ano" : "neste mês"
  const before = input.period === "year" ? "ano anterior" : "mês anterior"
  const top = input.topCategory
    ? ` ${input.topCategory.name} é a categoria que mais pesa (${Math.round(input.topCategory.percentage)}% dos gastos).`
    : ""

  if (input.net < 0) {
    return `Suas despesas superaram as receitas ${when}.${top} Vale revisar onde cortar.`
  }

  const expenseChange = percentChange(input.expense, input.previousExpense)
  if (expenseChange !== null && expenseChange >= 10) {
    return `Seus gastos subiram ${Math.round(expenseChange)}% em relação ao ${before}.${top}`
  }

  if (input.savingsRate >= 20) {
    return `Você guardou ${Math.round(input.savingsRate)}% da receita ${when}. Bom ritmo, continue assim!${top}`
  }

  return `Você guardou ${Math.round(input.savingsRate)}% da receita ${when}.${top}`
}

// Resumo em texto que vai no prompt da IA. Vazio = nada pra analisar (a consulta fica desligada).
export function buildOverviewSummaryText(input: OverviewInsightInput): string {
  if (input.income === 0 && input.expense === 0) return ""

  const expenseChange = percentChange(input.expense, input.previousExpense)
  const parts = [
    `Período: ${input.period === "year" ? "ano" : "mês"}`,
    `Receitas: ${input.income.toFixed(2)}`,
    `Despesas: ${input.expense.toFixed(2)}`,
    `Saldo do período: ${input.net.toFixed(2)}`,
    `Taxa de poupança: ${input.savingsRate.toFixed(0)}%`,
    expenseChange === null
      ? "Despesas vs período anterior: sem dados anteriores"
      : `Despesas vs período anterior: ${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(0)}%`,
  ]
  if (input.topCategory) {
    parts.push(
      `Categoria que mais pesa: ${input.topCategory.name} (${input.topCategory.percentage.toFixed(0)}% das despesas)`
    )
  }
  if (input.goalsPercentage !== null) {
    parts.push(`Progresso geral das metas: ${input.goalsPercentage.toFixed(0)}%`)
  }
  return parts.join("; ")
}