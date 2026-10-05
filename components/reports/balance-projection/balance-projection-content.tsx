import {
  getFlowMonthsCount,
  getMonthsRangeStrings,
  groupByMonth,
  calculateBalanceProjection,
  type ReportPeriod,
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"
import { ProjectedBalanceCard } from "@/components/reports/balance-projection/projected-balance-card"
import { ProjectionBreakdownCard } from "@/components/reports/balance-projection/projection-breakdown-card"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
//chart data

import { buildProjectionSeries } from "@/lib/reports"
import { BalanceProjectionChart } from "@/components/reports/balance-projection/balance-projection-chart"




export async function BalanceProjectionContent({ period }: { period: ReportPeriod }) {
  const supabase = await createClient()
  const monthsAhead = getFlowMonthsCount(period)

  // Saldo atual: soma de TODAS as transações até hoje, sem limite inferior de data.
  const allTransactions = await supabase
    .from("transactions")
    .select("amount, type")
    .throwOnError()

  const currentBalance = (allTransactions.data ?? []).reduce(
    (acc, t) => (t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)),
    0
  )

  // Últimos 3 meses (fixo), só pra calcular a média mensal.
  const { start, end } = getMonthsRangeStrings(3)
  const recent = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", start)
    .lte("date", end)
    .throwOnError()

  const recentMonths = groupByMonth(recent.data ?? [], 3)
  const projection = calculateBalanceProjection(currentBalance, recentMonths, monthsAhead)


    // depois de calcular `projection`:
  const chartData = buildProjectionSeries(
    currentBalance,
    recentMonths,
    projection.monthlyNet,
    monthsAhead
  )
  return (
    <div className="flex flex-col gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Saldo: realizado e projeção</CardTitle>
    </CardHeader>
    <CardContent>
      <BalanceProjectionChart data={chartData} />
    </CardContent>
  </Card>

  <div className="flex flex-col gap-4 lg:flex-row">
    <ProjectedBalanceCard projection={projection} />
    <ProjectionBreakdownCard projection={projection} period={period} />
  </div>
</div>
  )
}