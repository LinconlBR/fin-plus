"use client"

import { useBudgets, type BudgetWithSpent } from "@/hooks/use-budgets"
import { BudgetsDialog } from "@/components/budgets/budgets-dialog"
import { DeleteBudgetButton } from "@/components/budgets/budgets-delete-button"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Pencil } from "lucide-react"


import { useQuery } from "@tanstack/react-query"
import { generateBudgetInsight } from "@/lib/actions/ai"
//
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
 
// Mapeia cada status pra suas classes de cor — centralizado aqui evita
// repetir a mesma lógica de cor em 3 lugares diferentes do JSX embaixo.
const statusStyles = {
  excedido: {
    label: "Excedido",
    text: "text-destructive",
    indicator: "bg-destructive",
    border: "border-destructive/40",
  },
  atencao: {
    label: "Quase no limite",
    text: "text-amber-600",
    indicator: "bg-amber-500",
    border: "border-transparent",
  },
  normal: {
    label: "Dentro do limite",
    text: "text-emerald-600",
    indicator: "bg-emerald-500",
    border: "border-transparent",
  },
}
// Função para determinar o status do orçamento com base no gasto e no valor alvo
function getBudgetStatus(
  spent: number,
  targetAmount: number,
): "normal" | "atencao" | "excedido" {
  const percentage = targetAmount === 0 ? 0 : spent / targetAmount

  if (percentage >= 1) {
    return "excedido"
  }

  if (percentage >= 0.8) {
    return "atencao"
  }

  return "normal"
}

// função para gerar insights sobre os orçamentos 
function getBudgetInsight(budgetsWithStatus: (BudgetWithSpent & { status: string })[]): string {
    
    // Obtendo os nomes das categorias que excederam o orçamento
    const exceededBudgets = budgetsWithStatus
        .filter((b) => b.status === "excedido")
        .map((b) => b.category)

    // Obtendo os nomes das categorias que estão em alerta
    const attentionBudgets = budgetsWithStatus
        .filter((b) => b.status === "atencao")
        .map((b) => b.category)

    // Obtendo os nomes das categorias que estão normais
    const normalBudgets = budgetsWithStatus
        .filter((b) => b.status === "normal")
        .map((b) => b.category)

    // Gerando insights com base nos orçamentos excedidos, em alerta e normais
    if (exceededBudgets.length > 0 && attentionBudgets.length > 0) {
        return `Você excedeu o orçamento de ${exceededBudgets.join(", ")} e está próximo do limite em ${attentionBudgets.join(", ")}. Considere ajustar seus gastos nessas categorias.`
    }

    if (exceededBudgets.length > 0) {
        return `Você excedeu o orçamento de ${exceededBudgets.join(", ")} este período. Vale revisar seus gastos nessa categoria.`
    }

    if (attentionBudgets.length > 0) {
        return `Você está próximo do limite em ${attentionBudgets.join(", ")}. Fique de olho até o fim do período.`
    }

    if (normalBudgets.length > 0) {
        return `Você está dentro do limite em ${normalBudgets.join(", ")}. Continue assim!`
    }

    return ""
}

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
        const statusA = getBudgetStatus(a.spent, a.targetAmount)
        const statusB = getBudgetStatus(b.spent, b.targetAmount)

        return statusWeight[statusA] - statusWeight[statusB]
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
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Excedidos</p>
          <p className="text-2xl font-medium text-destructive">{exceededCount}</p>
        </CardContent>
      </Card>
    </div>
 
    {/* Insight */}
    {(aiInsight || budgetInsight) && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-400">{aiInsight || budgetInsight}</p>
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
                <span className={`text-sm font-medium ${styles.text}`}>
                  {styles.label}
                </span>
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

