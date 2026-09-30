import {
  changeTone,
  changeToneClass,
  getPreviousPeriodRangeStrings,
  getPeriodRangeStrings,
  summarizePeriod,
  percentChange,
  type ReportPeriod,
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent, formatPercentChange } from "@/lib/format"
import { cn } from "@/lib/utils"

type FlowRow = { amount: number | string; type: "income" | "expense" }

const tableGrid = "grid grid-cols-[1fr_130px_130px_110px] items-center gap-4"

 async function PeriodComparisonContent({
  period,
}: {
  period: ReportPeriod
}) {
  const currentPeriod = getPeriodRangeStrings(period, new Date())
  const previousPeriod = getPreviousPeriodRangeStrings(period, new Date())
  const supabase = await createClient()

  const [current, previous] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", currentPeriod.start)
      .lte("date", currentPeriod.end)
      .throwOnError(),
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", previousPeriod.start)
      .lte("date", previousPeriod.end)
      .throwOnError(),
  ])

  const currentSummary = summarizePeriod(
    (current.data ?? []) as FlowRow[],
    currentPeriod.start,
    currentPeriod.end
  )
  const previousSummary = summarizePeriod(
    (previous.data ?? []) as FlowRow[],
    previousPeriod.start,
    previousPeriod.end
  )

  if (
    currentSummary.transactionCount === 0 &&
    previousSummary.transactionCount === 0
  ) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Sem dados para comparar</p>
        <p className="text-sm text-muted-foreground">
          Registre transações nos dois períodos para ver a comparação.
        </p>
      </div>
    )
  }

  const rows: {
    label: string
    current: number
    previous: number
    format: (value: number) => string
    higherIsBetter: boolean | null
  }[] = [
    {
      label: "Receitas",
      current: currentSummary.income,
      previous: previousSummary.income,
      format: formatCurrency,
      higherIsBetter: true,
    },
    {
      label: "Despesas",
      current: currentSummary.expense,
      previous: previousSummary.expense,
      format: formatCurrency,
      higherIsBetter: false,
    },
    {
      label: "Saldo do período",
      current: currentSummary.net,
      previous: previousSummary.net,
      format: formatCurrency,
      higherIsBetter: true,
    },
    {
      label: "Taxa de poupança",
      current: currentSummary.savingsRate,
      previous: previousSummary.savingsRate,
      format: formatPercent,
      higherIsBetter: true,
    },
    {
      label: "Média semanal de gastos",
      current: currentSummary.weeklyAverageExpense,
      previous: previousSummary.weeklyAverageExpense,
      format: formatCurrency,
      higherIsBetter: false,
    },
    {
      label: "Número de transações",
      current: currentSummary.transactionCount,
      previous: previousSummary.transactionCount,
      format: (value) => String(value),
      higherIsBetter: null,
    },
  ]

  const comparisonLabel = period === "year" ? "vs ano anterior" : "vs mês anterior"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de períodos</CardTitle>
        <p className="text-sm text-muted-foreground">{comparisonLabel}</p>
      </CardHeader>
      <CardContent>
        <div className={cn(tableGrid, "pb-2 text-xs text-muted-foreground")}>
          <span>Métrica</span>
          <span className="text-right">Período anterior</span>
          <span className="text-right">Período atual</span>
          <span className="text-right">Variação</span>
        </div>

        {rows.map((row) => {
          const change = percentChange(row.current, row.previous)
          const tone =
            row.higherIsBetter === null ? "neutral" : changeTone(change, row.higherIsBetter)

          return (
            <div key={row.label} className={cn(tableGrid, "border-t py-3 text-sm")}>
              <span>{row.label}</span>
              <span className="text-right text-muted-foreground tabular-nums">
                {row.format(row.previous)}
              </span>
              <span className="text-right font-medium tabular-nums">
                {row.format(row.current)}
              </span>
              <span className={cn("text-right tabular-nums", changeToneClass[tone])}>
                {formatPercentChange(change)}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default PeriodComparisonContent;