import {
  changeTone,
  getComparableRanges,
  getComparisonLabel,
  monthToDate,
  summarizePeriod,
  percentChange,
  type ReportPeriod,
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercent, formatPercentChange } from "@/lib/format"
import { cn } from "@/lib/utils"

type FlowRow = { amount: number | string; type: "income" | "expense" }

// label + o par de barras | valor anterior | valor atual | selo de variação
const tableGrid = "grid grid-cols-[180px_1fr_110px_110px_90px] items-center gap-4"

const badgeVariant = {
  good: "success",
  bad: "destructive",
  neutral: "secondary",
} as const

export async function PeriodComparisonContent({
  period,
  month,
}: {
  period: ReportPeriod
  month: string
}) {
  // O período vem do mês navegado (no modo Ano, o ano desse mês), não de "hoje".
  const referenceDate = monthToDate(month)
  // Período em andamento compara do início até hoje com o mesmo trecho do anterior.
  // As duas médias semanais usam a mesma duração, então continuam comparáveis.
  const {
    current: currentPeriod,
    previous: previousPeriod,
    partial,
  } = getComparableRanges(period, referenceDate)
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

  const comparisonLabel = getComparisonLabel(period, partial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de períodos</CardTitle>
        <p className="text-sm text-muted-foreground">{comparisonLabel}</p>
      </CardHeader>
      <CardContent>
        <div className={cn(tableGrid, "pb-2 text-xs text-muted-foreground")}>
          <span>Métrica</span>
          <span></span>
          <span className="text-right">Período anterior</span>
          <span className="text-right">Período atual</span>
          <span className="text-right">Variação</span>
        </div>

        {rows.map((row) => {
          const change = percentChange(row.current, row.previous)
          const tone =
            row.higherIsBetter === null ? "neutral" : changeTone(change, row.higherIsBetter)

          // As duas barras são desenhadas relativas ao MAIOR valor da própria
          // linha (não entre linhas diferentes) — Math.max(..., 1) evita
          // dividir por zero quando os dois valores da linha são zero.
          const maxValue = Math.max(Math.abs(row.current), Math.abs(row.previous), 1)
          const previousBarWidth = (Math.abs(row.previous) / maxValue) * 100
          const currentBarWidth = (Math.abs(row.current) / maxValue) * 100

          return (
            <div key={row.label} className={cn(tableGrid, "border-t py-3 text-sm")}>
              <span className="font-medium">{row.label}</span>

              <div className="flex flex-col gap-1">
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-muted-foreground/50"
                    style={{ width: `${previousBarWidth}%` }}
                  />
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${currentBarWidth}%` }}
                  />
                </div>
              </div>

              <span className="text-right text-muted-foreground tabular-nums">
                {row.format(row.previous)}
              </span>
              <span className="text-right font-medium tabular-nums">
                {row.format(row.current)}
              </span>

              <div className="flex justify-end">
                <Badge variant={badgeVariant[tone]}>{formatPercentChange(change)}</Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}