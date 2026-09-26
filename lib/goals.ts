
import { type GoalWithProgress } from "@/hooks/use-goals"

export type GoalStatus = "concluida" | "atrasada" | "no_ritmo" | "sem_prazo"

// Mapeia cada status pra suas classes de cor — centralizado aqui evita repetição de lógica em 3 lugares diferentes do JSX embaixo.
export const statusStyles = {
  concluida: {
    label: "Concluída",
    text: "text-success",
    indicator: "bg-success",
    border: "border-success/40",
    badgeVariant: "success" as const,
  },
    atrasada: {
    label: "Atrasada",
    text: "text-destructive",
    indicator: "bg-destructive",    
    border: "border-destructive/40",
    badgeVariant: "destructive" as const,
  },
  no_ritmo: {
    label: "No ritmo",
    text: "text-warning",
    indicator: "bg-warning",
    border: "border-warning/40",
    badgeVariant: "warning" as const,
    },
    sem_prazo: {
        label: "Sem prazo",
        text: "text-muted-foreground",
        indicator: "bg-muted",
        border: "border-muted/40",
        badgeVariant: "secondary" as const,
    }, 
}

export  function getGoalStatus(goal: GoalWithProgress): GoalStatus {
   
  
    // 1. Se já bateu a meta, é "concluida"
    if (goal.current_amount >= goal.target_amount) {
      return "concluida"
    }
    // 2. Se não tem deadline OU não tem created_at, é "sem_prazo"
    if (!goal.deadline || !goal.created_at) {
        return "sem_prazo"
    }

    // 3. Calcula totalDias (created_at até deadline) e diasPassados (created_at até hoje)
    const createdAt = new Date(goal.created_at)
    const deadline = new Date(goal.deadline)
    const today = new Date()
    const totalDias = (deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const diasPassados = (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

     // Período de carência: não julga ritmo nos primeiros 7 dias de vida da meta,
    // nem antes de pelo menos 5% do prazo total ter passado — evita marcar uma
    // meta recém-criada como "atrasada" antes do usuário ter chance de contribuir.
    const diasDeCarencia = Math.max(7, totalDias * 0.05)
    if (diasPassados < diasDeCarencia) {
        return "no_ritmo"
    }

    // 4. progressoEsperado = diasPassados / totalDias (entre 0 e 1)
    const progressoEsperado = Math.min(Math.max(diasPassados / totalDias, 0), 1)

    // 5. progressoReal = currentAmount / target_amount
    const progressoReal = goal.current_amount / goal.target_amount

    // 6. Se progressoReal < progressoEsperado * 0.8 → "atrasada", senão → "no_ritmo"
    if (progressoReal < progressoEsperado * 0.8) {
        return "atrasada"
    } else {
        return "no_ritmo"
    }
}


export function getGoalStatusInsight(goal: GoalWithProgress): string {
    const status = getGoalStatus(goal)

    switch (status) {
        case "concluida":
            return "Parabéns! Você atingiu sua meta."
        case "atrasada":
            return "Você está atrasado em relação à sua meta. Considere aumentar suas contribuições."

        case "no_ritmo":
            return "Você está no ritmo certo para atingir sua meta. Continue assim!"
        case "sem_prazo":
            return "Este objetivo não possui um prazo definido. Definir um prazo pode ajudar a manter o foco."
    }
}


export function getGoalProgressPercentage(goal: GoalWithProgress): number {
    if (goal.target_amount === 0) {
        return 0
    }
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100)
}




export function getGoalsSummary(goals: GoalWithProgress[]) {
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0)
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0)

  const overallPercentage = totalTarget === 0 ? 0 : Math.min((totalSaved / totalTarget) * 100, 100)

  const activeCount = goals.filter((g) => getGoalStatus(g) !== "concluida").length

  return {
    totalSaved,
    totalTarget,
    overallPercentage,
    activeCount,
  }
}
