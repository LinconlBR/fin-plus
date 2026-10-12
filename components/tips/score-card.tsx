"use client"

import { getBudgetStatus } from "@/lib/budgets"
import { getFinancialScore, type ScoreLevel } from "@/lib/tips"
import { useBudgets } from "@/hooks/use-budgets"
import { useGoals } from "@/hooks/use-goals"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const levelColors: Record<ScoreLevel, string> = {
  Excelente: "text-success",
  Bom: "text-success",
  Regular: "text-warning",
  Atenção: "text-destructive",
}

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreCard({ savingsRate }: { savingsRate: number | null }) {
  const budgetsQuery = useBudgets()
  const goalsQuery = useGoals()

  if (budgetsQuery.isPending || goalsQuery.isPending) {
    return <Skeleton className="h-40 rounded-xl" />
  }

  const budgets = (budgetsQuery.data ?? []).map((b) => ({
    status: getBudgetStatus(b.spent, b.targetAmount),
  }))
  const result = getFinancialScore({
    savingsRate,
    budgets,
    goals: goalsQuery.data ?? [],
  })

  if (!result) {
    return (
      <Card>
        <CardContent>
          <p className="font-medium">Seu Score Financeiro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre transações, orçamentos ou metas para calcular a sua nota.
          </p>
        </CardContent>
      </Card>
    )
  }

  const color = levelColors[result.level]
  const offset = CIRCUMFERENCE * (1 - result.score / 100)

  return (
    <Card>
      <CardContent className="flex items-center gap-6">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className={`stroke-current ${color}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {result.score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Seu Score Financeiro</p>
          <p className={`text-2xl font-bold ${color}`}>{result.level}</p>
          <ul className="space-y-0.5 text-sm text-foreground/90">
            {result.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
