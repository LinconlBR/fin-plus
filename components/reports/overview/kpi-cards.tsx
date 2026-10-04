import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  changeTone,
  percentChange,
  type PeriodSummary,
  type ReportPeriod,
} from "@/lib/reports"
import {
  formatCurrency,
  formatPercent,
  formatPercentChange,
  formatPercentPoints,
} from "@/lib/format"

const badgeVariant = {
  good: "success",
  bad: "destructive",
  neutral: "secondary",
} as const

type Kpi = {
  label: string
  value: string
  change: string
  tone: keyof typeof badgeVariant
}

export function KpiCards({
  current,
  previous,
  period,
  href,
}: {
  current: PeriodSummary
  previous: PeriodSummary
  period: ReportPeriod
  href: string
}) {
  const compare = period === "year" ? "vs ano anterior" : "vs mês anterior"

  const incomeChange = percentChange(current.income, previous.income)
  const expenseChange = percentChange(current.expense, previous.expense)
  const netChange = percentChange(current.net, previous.net)

  // A taxa de poupança já é uma porcentagem: a diferença certa é em pontos
  // percentuais. Sem receita no período anterior, a taxa dele é 0 por falta de
  // base e não por mérito, então não há comparação a fazer.
  const rateDiff =
    previous.income === 0 ? null : current.savingsRate - previous.savingsRate

  const kpis: Kpi[] = [
    {
      label: "Receitas",
      value: formatCurrency(current.income),
      change: formatPercentChange(incomeChange),
      tone: changeTone(incomeChange, true),
    },
    {
      label: "Despesas",
      value: formatCurrency(current.expense),
      change: formatPercentChange(expenseChange),
      tone: changeTone(expenseChange, false), // gastar mais é pior
    },
    {
      label: "Saldo do período",
      value: formatCurrency(current.net),
      change: formatPercentChange(netChange),
      tone: changeTone(netChange, true),
    },
    {
      label: "Taxa de poupança",
      value: formatPercent(current.savingsRate),
      change: formatPercentPoints(rateDiff),
      tone: changeTone(rateDiff, true),
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariant[kpi.tone]}>{kpi.change}</Badge>
                <span className="text-xs text-muted-foreground">{compare}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-right">
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Ver comparativo completo →
        </Link>
      </div>
    </div>
  )
}