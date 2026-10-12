"use client"

import { ShieldAlert } from "lucide-react"
import { useBudgets } from "@/hooks/use-budgets"
import { statusStyles } from "@/lib/budgets"
import { formatCurrency, formatPercent } from "@/lib/format"
import { getBudgetsAtRisk } from "@/lib/dashboard-widgets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardBudgetsAtRisk({ month }: { month: string }) {
  const { data, isPending, isError } = useBudgets(month)

  let content: React.ReactNode
  if (isPending) {
    content = <Skeleton className="h-24 rounded-lg" />
  } else if (isError) {
    content = <p className="text-sm text-muted-foreground">Não foi possível carregar os orçamentos.</p>
  } else if (data.length === 0) {
    content = <p className="text-sm text-muted-foreground">Nenhum orçamento neste mês.</p>
  } else {
    const atRisk = getBudgetsAtRisk(data)
    content =
      atRisk.length === 0 ? (
        <p className="text-sm text-success">Todos os orçamentos estão dentro do limite.</p>
      ) : (
        <ul className="space-y-4">
          {atRisk.map((budget) => {
            const style = statusStyles[budget.status]
            return (
              <li key={budget.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className={style.text}>{formatPercent(budget.percentage)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${style.indicator}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(budget.spent)} de {formatCurrency(budget.target)} · {style.label}
                </p>
              </li>
            )
          })}
        </ul>
      )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldAlert className="size-4 text-accent-violet" />
        <CardTitle>Orçamentos em risco</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
