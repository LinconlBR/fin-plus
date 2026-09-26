"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { useQuery } from "@tanstack/react-query"
import { generateBudgetInsight } from "@/lib/actions/ai"

import { useBudgets } from "@/hooks/use-budgets"
import { BudgetsDialog } from "@/components/budgets/budgets-dialog"
import { DeleteBudgetButton } from "@/components/budgets/budgets-delete-button"
import { getBudgetStatus, getBudgetInsight, statusStyles } from "@/lib/budgets" 

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
 


export function BudgetsContent() {
    const { data, isLoading, isError } = useBudgets()
    const budgets = data ?? []

    
    // Calculando o status de cada orçamento com base no gasto e no valor alvo
    const budgetsWithStatus = budgets.map((budget) => ({
        ...budget,
        status: getBudgetStatus(budget.spent, budget.targetAmount),
    }))

    // Definindo a prioridade de cada status para ordenação
    const statusWeight = { excedido: 0, atencao: 1, normal: 2 }

    // Ordenando os orçamentos com base no status, do mais crítico para o menos crítico
    const sortedBudgets = [...budgetsWithStatus].sort((a, b) => {
      return statusWeight[a.status] - statusWeight[b.status]
    })
    
    // Calculando o total orçado
    const totalBudgeted = budgetsWithStatus.reduce((acc, b) => acc + b.targetAmount, 0)
    
    // Calculando o total gasto 
    const totalSpent = budgetsWithStatus.reduce((acc, b) => acc + b.spent, 0)
   
    // Calculando o número de categorias que excederam o orçamento
    const exceededCount = budgetsWithStatus.filter((b) => b.status === "excedido").length
    
    const summary = budgetsWithStatus
  .map((b) => `${b.category}: gastou ${b.spent} de ${b.targetAmount} (${b.status})`)
  .join("; ")

    const { data: aiInsight } = useQuery({
    queryKey: ["budget-insight", summary],
    queryFn: () => generateBudgetInsight(summary),
    enabled: budgetsWithStatus.length > 0, // só chama a IA se tiver orçamento
    })

    if (isLoading) return <div>Carregando orçamentos...</div>
    if (isError) return <div>Erro ao carregar orçamentos.</div>

    if (budgets.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
      <p className="font-medium">Você ainda não tem orçamentos</p>
      <p className="text-sm text-muted-foreground">
        Crie um limite para começar a acompanhar seus gastos por categoria.
      </p>
      <BudgetsDialog />
    </div>
  )
}
    const budgetInsight = getBudgetInsight(budgetsWithStatus)
    return (
  <div className="space-y-6">
    {/* Cards de resumo */}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total orçado</p>
          <p className="text-2xl font-medium">
            {currencyFormatter.format(totalBudgeted)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total gasto</p>
          <p className="text-2xl font-medium">
            {currencyFormatter.format(totalSpent)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Orçamentos ativos</p>
          <p className="text-2xl font-medium">{budgets.length}</p>
        </CardContent>
      </Card>
      <Card className={exceededCount > 0 ? "border-destructive/40 shadow-glow-danger" : undefined}>
        <CardContent>
          <p className="text-sm text-muted-foreground">Excedidos</p>
          <p className="text-2xl font-medium text-destructive">{exceededCount}</p>
        </CardContent>
      </Card>
    </div>

    {/* Insight */}
    {(aiInsight || budgetInsight) && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-accent-violet/10 p-4">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-violet" />
            <p className="text-sm text-foreground/90">{aiInsight || budgetInsight}</p>
        </div>
    )}
 
    {/* Grid de orçamentos, já ordenado por urgência */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedBudgets.map((budget) => {
        const styles = statusStyles[budget.status]
        const percentage = Math.min(
          (budget.spent / budget.targetAmount) * 100,
          100
        )
 
        return (
          <Card key={budget.id} className={styles.border}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{budget.category}</p>
                <div className="flex items-center gap-1">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {budget.isRecurring
                      ? budget.period === "weekly"
                        ? "Recorrente · semanal"
                        : "Recorrente · mensal"
                      : "Único"}
                  </span>
                  <BudgetsDialog
                    budget={budget}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteBudgetButton id={budget.id} />
                </div>
              </div>
 
              <Progress value={percentage} indicatorClassName={styles.indicator} />
 
              <div className="flex items-baseline justify-between">
                <Badge variant={styles.badgeVariant}>
                  {styles.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currencyFormatter.format(budget.spent)} /{" "}
                  {currencyFormatter.format(budget.targetAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  </div>
)

}

