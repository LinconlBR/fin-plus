"use client"

import { Target } from "lucide-react"
import { useGoals } from "@/hooks/use-goals"
import { statusStyles } from "@/lib/goals"
import { formatCurrency, formatPercent } from "@/lib/format"
import { getGoalsHighlights } from "@/lib/dashboard-widgets"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardGoalsProgress() {
  const { data, isPending, isError } = useGoals()

  let content: React.ReactNode
  if (isPending) {
    content = <Skeleton className="h-24 rounded-lg" />
  } else if (isError) {
    content = <p className="text-sm text-muted-foreground">Não foi possível carregar as metas.</p>
  } else if (data.length === 0) {
    content = <p className="text-sm text-muted-foreground">Você ainda não tem metas.</p>
  } else {
    const { highlights, completed } = getGoalsHighlights(data)
    content = (
      <div className="space-y-4">
        {highlights.length === 0 ? (
          <p className="text-sm text-success">Todas as suas metas foram concluídas!</p>
        ) : (
          <ul className="space-y-4">
            {highlights.map((goal) => {
              const style = statusStyles[goal.status]
              return (
                <li key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <Badge variant={style.badgeVariant}>{style.label}</Badge>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${style.indicator}`}
                      style={{ width: `${goal.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(goal.saved)} de {formatCurrency(goal.target)} ·{" "}
                    {formatPercent(goal.percentage)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
        {completed > 0 && (
          <p className="text-xs text-muted-foreground">
            {completed} {completed === 1 ? "meta concluída" : "metas concluídas"}
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <Target className="size-4 text-accent-violet" />
        <CardTitle>Metas em andamento</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
