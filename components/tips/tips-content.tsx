import { toDateString } from "@/lib/reports"
import { getMonthAnalysis } from "@/lib/overview"
import {
  buildSavingsSummary,
  getDailyTip,
  getHabitInsight,
  getSavingsFallback,
} from "@/lib/tips"
import { DailyTipCard } from "@/components/tips/daily-tip-card"
import { HabitsCard } from "@/components/tips/habits-card"
import { SavingsCard } from "@/components/tips/savings-card"
import { ScoreCard } from "@/components/tips/score-card"

// Server component: busca as transações do mês atual e calcula tudo que não depende
// de orçamentos e metas. O ScoreCard (cliente) completa a nota com esses dois.
export async function TipsContent() {
  const now = new Date()
  const month = toDateString(now).slice(0, 7)
  const { input, categories, previousCategories, partial } = await getMonthAnalysis(month)

  const hasMovement = input.income !== 0 || input.expense !== 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Insights baseados no seu perfil e nos seus hábitos de consumo deste mês.
      </p>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <ScoreCard savingsRate={hasMovement ? input.savingsRate : null} />
          <DailyTipCard tip={getDailyTip(now)} />
        </div>
        <div className="space-y-6">
          <HabitsCard
            insight={getHabitInsight(categories, previousCategories, partial)}
            hasData={hasMovement}
          />
          <SavingsCard
            summary={buildSavingsSummary({
              income: input.income,
              expense: input.expense,
              categories,
            })}
            fallback={getSavingsFallback(categories)}
          />
        </div>
      </div>
    </div>
  )
}
