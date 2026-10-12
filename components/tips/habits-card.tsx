import type { HabitInsight } from "@/lib/tips"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HabitsCard({
  insight,
  hasData,
}: {
  insight: HabitInsight | null
  hasData: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Hábitos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-accent-violet/30 bg-accent-violet/5 p-4 text-sm text-foreground/90">
          {insight ? (
            <p>
              Seus gastos com <strong>{insight.category}</strong>{" "}
              <strong className={insight.kind === "up" ? "text-destructive" : "text-success"}>
                {insight.kind === "up" ? "aumentaram" : "caíram"} {insight.change}%
              </strong>{" "}
              {insight.comparison}.{" "}
              {insight.kind === "up"
                ? "Vale revisar esse hábito e ver onde dá para cortar."
                : "Bom trabalho, continue assim!"}
            </p>
          ) : hasData ? (
            <p>Nenhuma categoria mudou de forma relevante em relação ao período anterior. Seus hábitos estão estáveis.</p>
          ) : (
            <p>Registre transações para analisarmos os seus hábitos de consumo.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
