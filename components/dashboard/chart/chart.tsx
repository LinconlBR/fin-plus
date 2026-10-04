import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart/chart-interactive"
import { getPeriodRangeStrings, getWeekRangeStrings } from "@/lib/reports"

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

  // Decide o intervalo a partir do modo ativo — mês navegado ou semana navegada.
  const [weekYear, weekM, weekD] = week.split("-").map(Number)
const weekRange = getWeekRangeStrings(new Date(weekYear, weekM - 1, weekD))

const range = chartRange === "week" ? weekRange : (() => {
  const [year, m] = month.split("-").map(Number)
  return getPeriodRangeStrings("month", new Date(year, m - 1, 1))
})()

  const { data: transactionsBefore } = await supabase
    .from("transactions")
    .select("amount, type")
    .lt("date", range.start)

  const saldoInicial = (transactionsBefore ?? []).reduce((acc, t) => {
    return t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)

  const { data: transactionsInRange } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", range.start)
    .lte("date", range.end)
    .order("date", { ascending: true })

  const grouped: Record<string, { net: number; expense: number }> = {}
  for (const t of transactionsInRange ?? []) {
    const day = t.date
    if (!grouped[day]) grouped[day] = { net: 0, expense: 0 }
    if (t.type === "income") {
      grouped[day].net += Number(t.amount)
    } else {
      grouped[day].expense += Number(t.amount)
      grouped[day].net -= Number(t.amount)
    }
  }

  let saldoAcumulado = saldoInicial
  const chartPoints = Object.entries(grouped).map(([date, values]) => {
    saldoAcumulado += values.net
    return { date, currentBalance: saldoAcumulado, expense: values.expense }
  })

    return <ChartAreaInteractive data={chartPoints} chartRange={chartRange} month={month} week={week} />
}