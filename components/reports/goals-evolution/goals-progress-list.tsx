import { getGoalStatus, statusStyles } from "@/lib/goals"
import { type GoalWithProgress } from "@/hooks/use-goals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CATEGORY_COLORS } from "@/components/categories/category-colors"
import { formatCurrency } from "@/lib/format"

export  function GoalsProgressList({ goals }: { goals: GoalWithProgress[] }) {
  return (
    <Card className="lg:w-96">
      <CardHeader>
        <CardTitle>Suas metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, index) => {
          const status = getGoalStatus(goal)
          const styles = statusStyles[status]
          const percentage = Math.min(Math.max(goal.progress, 0), 100)

          return (
            <div key={goal.id} className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    }}
                  />
                  <span className="truncate">{goal.name}</span>
                </span>
                <Badge variant={styles.badgeVariant}>{styles.label}</Badge>
              </div>

              <Progress value={percentage} indicatorClassName={styles.indicator} />

              <div className="text-right text-xs text-muted-foreground tabular-nums">
                {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}