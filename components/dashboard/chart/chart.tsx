import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart/chart-interactive"
import {
  buildDailyBalanceSeries,
  getPeriodRangeStrings,
  getWeekBounds,
  getWeekRangeWithinMonth,
  toDateString,
} from "@/lib/reports"

export async function DashboardChart({
  month,
  week,
  chartRange,
}: {
  month: string
  week: string
  chartRange: "month" | "week"
}) {
  const supabase = await createClient()

  // Mês navegado, ou a semana navegada RECORTADA pelo mês (só os dias dele).
  const [year, m] = month.split("-").map(Number)
  const range =
    chartRange === "week"
      ? getWeekRangeWithinMonth(week, month)
      : getPeriodRangeStrings("month", new Date(year, m - 1, 1))

  const { minWeek, maxWeek } = getWeekBounds(month)

  // Tudo que veio antes do intervalo vira o saldo de partida do gráfico.
  const [before, inRange] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type")
      .lt("date", range.start)
      .throwOnError(),
    supabase
      .from("transactions")
      .select("amount, type, date")
      .gte("date", range.start)
      .lte("date", range.end)
      .order("date", { ascending: true })
      .throwOnError(),
  ])

  const initialBalance = (before.data ?? []).reduce(
    (acc, t) => (t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)),
    0
  )

  const grouped: Record<string, { net: number; expense: number }> = {}
  for (const t of inRange.data ?? []) {
    const day = t.date
    if (!grouped[day]) grouped[day] = { net: 0, expense: 0 }
    if (t.type === "income") {
      grouped[day].net += Number(t.amount)
    } else {
      grouped[day].expense += Number(t.amount)
      grouped[day].net -= Number(t.amount)
    }
  }

  // Um ponto por dia, parando em hoje (nada de dias futuros preenchidos).
  const chartPoints = buildDailyBalanceSeries(
    grouped,
    initialBalance,
    range.start,
    range.end,
    toDateString(new Date())
  )

  return (
    <ChartAreaInteractive
      data={chartPoints}
      chartRange={chartRange}
      month={month}
      week={week}
      minWeek={minWeek}
      maxWeek={maxWeek}
    />
  )
}