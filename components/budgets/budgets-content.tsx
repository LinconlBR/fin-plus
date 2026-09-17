"use client"

import { useBudgets, type BudgetWithSpent } from "@/hooks/use-budgets"

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


export function BudgetsContent() {
    const { data, isLoading, isError } = useBudgets()
    const budgets = data ?? []

    if (isLoading) return <div>Carregando orçamentos...</div>
    if (isError) return <div>Erro ao carregar orçamentos.</div>
    
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

            console.log({ exceededBudgets}, {attentionBudgets}, {normalBudgets })
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
    

    const budgetInsight = getBudgetInsight(budgetsWithStatus)

}

