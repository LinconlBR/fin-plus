
import { type BudgetWithSpent } from "@/hooks/use-budgets"

type Budget = {
  is_recurring: boolean
  period: "weekly" | "monthly"
  start_date: string
  end_date: string | null
}


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
export function getBudgetInsight(budgetsWithStatus: (BudgetWithSpent & { status: string })[]): string {
    
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

export function getBudgetPeriodRange(budget: Budget): { start: string; end: string } | null {
    
    // Se o orçamento não tiver período definido, retorna null
    if (!budget || !budget.period) {
        return null;
    }
    // Caso 1: orçamento único, não recorrente — usa as datas guardadas, sem calcular nada
  if (!budget.is_recurring) {
    return {
      start: budget.start_date,
      end: budget.end_date ?? budget.start_date,
    }
  }
   const now = new Date()

    // Caso 2: recorrente mensal 
  if (budget.period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    }
  }
    // Caso 3: recorrente semanal — sua vez de completar
  if (budget.period === "weekly") {
    const dayOfWeek = now.getDay() // 0 = domingo, 1 = segunda, ..., 6 = sábado

    // 1. Cria uma data a partir de hoje, e volta X dias até o domingo da semana atual
    const startDate = new Date(now) // clona `now`, não cria uma data nova do zero
    startDate.setDate(now.getDate() - dayOfWeek) // volta X dias a partir do dia-do-mês atual
    
    // 2. Cria uma segunda data, a partir do domingo encontrado, e soma 6 dias, achando o sábado
    const endDate = new Date(startDate) // clona o domingo que acabamos de achar
    endDate.setDate(startDate.getDate() + 6) // avança 6 dias a partir dele
    
    // 3. Retorna as duas, convertidas com .toISOString().split("T")[0]
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  }
  return null; // caso o período não seja reconhecido, retorna null
}
    

