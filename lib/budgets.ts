

// Mapeia cada status pra suas classes de cor — centralizado aqui evita
// repetir a mesma lógica de cor em 3 lugares diferentes do JSX embaixo.
export const statusStyles = {
  excedido: {
    label: "Excedido",
    text: "text-destructive",
    indicator: "bg-destructive",
    border: "border-destructive/40 shadow-glow-danger",
    badgeVariant: "destructive" as const,
  },
  atencao: {
    label: "Quase no limite",
    text: "text-warning",
    indicator: "bg-warning",
    border: "border-transparent",
    badgeVariant: "warning" as const,
  },
  normal: {
    label: "Dentro do limite",
    text: "text-success",
    indicator: "bg-success",
    border: "border-transparent",
    badgeVariant: "success" as const,
  },
}
// Função para determinar o status do orçamento com base no gasto e no valor alvo
export function getBudgetStatus(
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
export function getBudgetInsight(budgetsWithStatus: { category: string; status: string }[]): string {
    
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

    

// Função para determinar o status do orçamento com base no gasto e no valor alvo
type BudgetHistoryEntry = {
  budget_id: string
  period: string // "YYYY-MM"
  amount: number | string
}

export function findBudgetAmountForMonth(
  history: BudgetHistoryEntry[],
  budgetId: string,
  targetMonth: string // "YYYY-MM"
): number | null {
    // 1. Só as entradas desse orçamento, até (inclusive) o mês alvo
    const candidates = history.filter(
        (e) => e.budget_id === budgetId && e.period <= targetMonth
    )

    if (candidates.length === 0) {
        return null
    }

    // 2. A mais recente dentre as candidatas — reduce comparando o period,
    // igual você faria pra achar o maior número de um array
    const mostRecent = candidates.reduce((latest, current) =>
        current.period > latest.period ? current : latest
    )

    return typeof mostRecent.amount === "string"
        ? parseFloat(mostRecent.amount)
        : mostRecent.amount
}


export function intersectDateRanges(
  rangeA: { start: string; end: string },
  rangeB: { start: string; end: string }
): { start: string; end: string } | null {
  const start = rangeA.start > rangeB.start ? rangeA.start : rangeB.start
  const end = rangeA.end < rangeB.end ? rangeA.end : rangeB.end

  if (start > end) {
    return null
  }

  return { start, end }
}