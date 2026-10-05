import {
  changeTone,
  changeToneClass,
  getFlowWindow,
  getMonthsRangeStrings,
  groupByMonth,
  type ReportPeriod,
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"
import { MonthlyFlowChart } from "@/components/reports/income-vs-expense/monthly-flow-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

type FlowRow = { amount: number | string; type: "income" | "expense"; date: string }

const tableGrid = "grid grid-cols-[1fr_120px_120px_130px] items-center gap-4"

export async function IncomeVsExpensesContent({
  period,
  month,
}: {
  period: ReportPeriod
  month: string
}) {
  // Mês: os 6 meses que terminam no mês navegado. Ano: o ano-calendário dele.
  const { monthsCount, referenceDate, label: windowLabel } = getFlowWindow(period, month)
  const { start, end } = getMonthsRangeStrings(monthsCount, referenceDate)
  const supabase = await createClient()

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .gte("date", start)
    .lte("date", end)
    .throwOnError()

  const flow = groupByMonth((data ?? []) as FlowRow[], monthsCount, referenceDate)

  const isEmpty = flow.every((m) => m.income === 0 && m.expense === 0)

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Sem lançamentos neste período</p>
        <p className="text-sm text-muted-foreground">
          Registre transações para ver receitas e despesas ao longo do tempo.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs despesas</CardTitle>
          <p className="text-sm text-muted-foreground">{windowLabel}</p>
        </CardHeader>
        <CardContent>
          <MonthlyFlowChart data={flow} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhe por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(tableGrid, "pb-2 text-xs text-muted-foreground")}>
            <span>Mês</span>
            <span className="text-right">Receitas</span>
            <span className="text-right">Despesas</span>
            <span className="text-right">Saldo do mês</span>
          </div>

          {flow.map((m) => {
            const net = m.income - m.expense
            return (
              <div key={m.month} className={cn(tableGrid, "border-t py-3 text-sm")}>
                <span>{m.label}</span>
                <span className="text-right tabular-nums text-income">
                  {formatCurrency(m.income)}
                </span>
                <span className="text-right tabular-nums text-expense">
                  {formatCurrency(m.expense)}
                </span>
                <span
                  className={cn(
                    "text-right font-medium tabular-nums",
                    changeToneClass[changeTone(net, true)]
                  )}
                >
                  {formatCurrency(net)}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}