import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart/chart-interactive"
import { getPeriodRangeStrings, getWeekRangeStrings, toDateString } from "@/lib/reports"

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

  const chartPoints: { date: string; currentBalance: number; expense: number }[] = []
let saldoAcumulado = saldoInicial

const [sy, sm, sd] = range.start.split("-").map(Number)
const [ey, em, ed] = range.end.split("-").map(Number)
const cursor = new Date(sy, sm - 1, sd)
const last = new Date(ey, em - 1, ed)

while (cursor <= last) {
  const day = toDateString(cursor)
  const values = grouped[day]
  if (values) saldoAcumulado += values.net
  chartPoints.push({ date: day, currentBalance: saldoAcumulado, expense: values?.expense ?? 0 })
  cursor.setDate(cursor.getDate() + 1)
}


    return <ChartAreaInteractive data={chartPoints} chartRange={chartRange} month={month} week={week} />
}