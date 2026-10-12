"use client"

import { useQuery } from "@tanstack/react-query"
import { Gauge, Lightbulb, PiggyBank, Receipt, Target, type LucideIcon } from "lucide-react"
import { generateTipsReport } from "@/lib/actions/ai"
import { getBudgetInsight, getBudgetStatus } from "@/lib/budgets"
import { buildTipsSummary, getGoalsFallbackTip, parseTipsReport, TIP_TOPICS, type TipTopic } from "@/lib/tips"
import { getGoalStatus } from "@/lib/goals"
import { useBudgets } from "@/hooks/use-budgets"
import { useGoals } from "@/hooks/use-goals"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const topicIcons: Record<TipTopic, LucideIcon> = {
  Gastos: Receipt,
  Orçamentos: Gauge,
  Metas: Target,
  Economia: PiggyBank,
}

export function TipsReport({
  overviewSummary,
  overviewFallback,
}: {
  overviewSummary: string
  overviewFallback: string
}) {
  const budgetsQuery = useBudgets()
  const goalsQuery = useGoals()
  const budgets = budgetsQuery.data
  const goals = goalsQuery.data

  const budgetsWithStatus = (budgets ?? []).map((budget) => ({
    ...budget,
    status: getBudgetStatus(budget.spent, budget.targetAmount),
  }))

  const budgetsSummary = budgetsWithStatus
    .map((b) => `${b.category}: gastou ${b.spent} de ${b.targetAmount} (${b.status})`)
    .join("; ")

  const goalsSummary = (goals ?? [])
    .map((g) => `${g.name}: guardou ${g.current_amount} de ${g.target_amount} (${getGoalStatus(g)})`)
    .join("; ")

  const summary = buildTipsSummary({
    overview: overviewSummary,
    budgets: budgetsSummary,
    goals: goalsSummary,
  })

  // Só pergunta à IA depois que orçamentos e metas carregaram: senão a primeira chamada
  // iria com o resumo incompleto e a segunda gastaria cota de novo com o resumo final.
  const ready = !budgetsQuery.isPending && !goalsQuery.isPending

  const { data: aiText, isFetching } = useQuery({
    queryKey: ["tips-report", summary],
    queryFn: () => generateTipsReport(summary),
    enabled: ready && summary !== "",
    staleTime: 1000 * 60 * 30, // mesmos dados = mesmas dicas
  })

  const aiTips = aiText ? parseTipsReport(aiText) : []

  // Dicas por regras: aparecem na hora e cobrem o caso da IA falhar.
  const fallbackText: Partial<Record<TipTopic, string>> = {
    Gastos: overviewFallback,
    Orçamentos: getBudgetInsight(budgetsWithStatus),
    Metas: getGoalsFallbackTip(goals ?? []),
  }

  const tips = TIP_TOPICS.map((topic) => {
    const ai = aiTips.find((tip) => tip.topic === topic)
    if (ai) return { topic, text: ai.text, source: "ia" as const }
    const rule = fallbackText[topic]
    return rule ? { topic, text: rule, source: "regras" as const } : null
  }).filter((tip) => tip !== null)

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {TIP_TOPICS.map((topic) => (
          <Skeleton key={topic} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  if (tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <Lightbulb className="size-6 text-accent-violet" />
        <p className="font-medium">Ainda não há dados para analisar</p>
        <p className="text-sm text-muted-foreground">
          Registre transações, orçamentos ou metas para receber dicas personalizadas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isFetching && aiTips.length === 0 && (
        <p className="text-sm text-muted-foreground">Gerando dicas personalizadas com IA…</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map(({ topic, text, source }) => {
          const Icon = topicIcons[topic]
          return (
            <Card key={topic}>
              <CardHeader className="flex flex-row items-center gap-2">
                <Icon className="size-4 text-accent-violet" />
                <CardTitle>{topic}</CardTitle>
                <Badge variant={source === "ia" ? "secondary" : "outline"} className="ml-auto">
                  {source === "ia" ? "IA" : "Regras"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90">{text}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
