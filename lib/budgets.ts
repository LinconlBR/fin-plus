
type Budget = {
  is_recurring: boolean
  period: "weekly" | "monthly"
  start_date: string
  end_date: string | null
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
    

