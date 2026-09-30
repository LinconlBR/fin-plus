import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { BalanceProjection, ReportPeriod } from "@/lib/reports"

export function ProjectionBreakdownCard({
  projection,
  period,
}: {
  projection: BalanceProjection
  period: ReportPeriod
}) {
  const rows = [
    { label: "Receita média mensal", value: formatCurrency(projection.avgMonthlyIncome) },
    { label: "Despesa média mensal", value: formatCurrency(projection.avgMonthlyExpense) },
    { label: "Sobra estimada por mês", value: formatCurrency(projection.monthlyNet) },
    {
      label: period === "year" ? "Meses restantes no ano" : "Meses projetados",
      value: String(projection.monthsAhead),
    },
  ]

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Como calculamos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-t py-2 text-sm first:border-t-0"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}