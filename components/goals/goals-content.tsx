"use client"

import { useQuery } from "@tanstack/react-query"
import { Pencil, Lightbulb, Plus } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

import { useGoals, type GoalWithProgress } from "@/hooks/use-goals"
import { GoalDialog } from "@/components/goals/goal-dialog"
import { GoalContributionDialog } from "@/components/goals/goal-contribution-dialog"
import { DeleteGoalButton } from "@/components/goals/delete-goal-button"
import { generateGoalsInsight } from "@/lib/actions/ai"
import {
  getGoalStatus,
  getGoalsSummary,
  getGoalProgressPercentage,
  statusStyles,
} from "@/lib/goals"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
})

export function GoalsContent() {
  const { data, isLoading, isError } = useGoals()
  const goals = data ?? []

  const summary = getGoalsSummary(goals)

  // Resumo em texto, montado a partir dos dados reais — é isso que vai pra
  // IA gerar o insight personalizado. Muda sempre que os dados mudam, o que
  // faz a queryKey abaixo invalidar e buscar um insight novo automaticamente.
  const goalsSummaryText = goals
    .map(
      (g) =>
        `${g.name}: guardou ${g.current_amount} de ${g.target_amount} (${getGoalStatus(
          g
        )})`
    )
    .join("; ")

  const { data: aiInsight } = useQuery({
    queryKey: ["goals-insight", goalsSummaryText],
    queryFn: () => generateGoalsInsight(goalsSummaryText),
    enabled: goals.length > 0,
  })

  if (isLoading) return <div>Carregando metas...</div>
  if (isError) return <div>Erro ao carregar metas.</div>

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Você ainda não tem metas</p>
        <p className="text-sm text-muted-foreground">
          Crie uma meta para começar a planejar seus objetivos financeiros.
        </p>
        <GoalDialog />
      </div>
    )
  }

  // Fallback baseado em regras — usado se a IA falhar ou ainda não respondeu.
  const atrasada = goals.find((g) => getGoalStatus(g) === "atrasada")
  const todasConcluidas = goals.every((g) => getGoalStatus(g) === "concluida")
  const rulesInsight = atrasada
    ? `Sua meta "${atrasada.name}" está atrasada em relação ao prazo. Considere aumentar suas contribuições.`
    : todasConcluidas
    ? "Parabéns! Todas as suas metas estão concluídas."
    : "Suas metas estão no ritmo certo. Continue assim!"

  return (
    <div className="space-y-6">
      {/* Progresso geral, somando todas as metas */}
      <Card className="border-success/40">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">Progresso Geral das Metas</p>
            <span className="text-sm text-muted-foreground">
              {summary.activeCount} meta{summary.activeCount === 1 ? "" : "s"} ativa
              {summary.activeCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">
              {summary.overallPercentage.toFixed(0)}%
            </span>
          </div>

          <Progress value={summary.overallPercentage} indicatorClassName="bg-success" />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currencyFormatter.format(summary.totalSaved)}</span>
            <span>{currencyFormatter.format(summary.totalTarget)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Insight — IA com fallback baseado em regras */}
      {(aiInsight || rulesInsight) && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-accent-violet/10 p-4">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-violet" />
          <p className="text-sm text-foreground/90">{aiInsight || rulesInsight}</p>
        </div>
      )}

      {/* Grid de metas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal: GoalWithProgress) => {
          const status = getGoalStatus(goal)
          const styles = statusStyles[status]
          const percentage = getGoalProgressPercentage(goal)

          return (
            <Card key={goal.id} className={styles.border}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-medium">{goal.name}</p>
                  <div className="flex items-center gap-1">
                    <GoalDialog
                      goal={goal}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteGoalButton id={goal.id} />
                  </div>
                </div>

                <Progress value={percentage} indicatorClassName={styles.indicator} />

                <div className="flex items-baseline justify-between">
                  <Badge variant={styles.badgeVariant}>{styles.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {currencyFormatter.format(goal.current_amount)} /{" "}
                    {currencyFormatter.format(goal.target_amount)}
                  </span>
                </div>

                {goal.deadline && status !== "concluida" && (
                  <p className="text-xs text-muted-foreground">
                    Previsão: {dateFormatter.format(new Date(goal.deadline))}
                  </p>
                )}

                <GoalContributionDialog
                  goal_id={goal.id}
                  trigger={
                    <Button variant="outline" className="w-full">
                      <Plus className="size-4" />
                      Adicionar valor
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}