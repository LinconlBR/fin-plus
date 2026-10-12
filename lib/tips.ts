import { formatCurrency, formatPercent } from "@/lib/format"
import { getGoalStatus, type GoalStatus } from "@/lib/goals"
import type { GoalWithProgress } from "@/hooks/use-goals"

export type CategoryTotal = { id: string; name: string; total: number }

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm
}

// ---------- Score financeiro ----------

export type ScoreLevel = "Excelente" | "Bom" | "Regular" | "Atenção"

export type FinancialScore = {
  score: number
  level: ScoreLevel
  // Frases curtas explicando de onde veio a nota.
  highlights: string[]
}

// Quanto cada parte vale (soma 100). Partes sem dados saem da conta e a nota
// é recalculada só com as que existem, em vez de punir quem ainda não tem metas.
const SCORE_WEIGHTS = { savings: 40, budgets: 30, goals: 30 }
// Poupar 20% da receita já dá a pontuação máxima dessa parte.
const SAVINGS_RATE_FOR_FULL_SCORE = 20

const BUDGET_POINTS = { normal: 1, atencao: 0.5, excedido: 0 }
const GOAL_POINTS: Record<GoalStatus, number> = {
  concluida: 1,
  no_ritmo: 1,
  sem_prazo: 0.75,
  atrasada: 0,
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "Excelente"
  if (score >= 70) return "Bom"
  if (score >= 50) return "Regular"
  return "Atenção"
}

// savingsRate = null quando o mês não tem movimento (não dá para avaliar a poupança).
export function getFinancialScore(input: {
  savingsRate: number | null
  budgets: { status: "normal" | "atencao" | "excedido" }[]
  goals: GoalWithProgress[]
}): FinancialScore | null {
  let earned = 0
  let max = 0
  const highlights: string[] = []

  if (input.savingsRate !== null) {
    const ratio = Math.min(Math.max(input.savingsRate / SAVINGS_RATE_FOR_FULL_SCORE, 0), 1)
    earned += ratio * SCORE_WEIGHTS.savings
    max += SCORE_WEIGHTS.savings

    if (input.savingsRate > 0) {
      highlights.push(`Você guardou ${formatPercent(input.savingsRate)} da receita.`)
    } else if (input.savingsRate === 0) {
      highlights.push("Você gastou toda a receita do mês.")
    } else {
      highlights.push("Suas despesas superaram as receitas.")
    }
  }

  if (input.budgets.length > 0) {
    const average =
      input.budgets.reduce((sum, b) => sum + BUDGET_POINTS[b.status], 0) / input.budgets.length
    earned += average * SCORE_WEIGHTS.budgets
    max += SCORE_WEIGHTS.budgets

    const exceeded = input.budgets.filter((b) => b.status === "excedido").length
    highlights.push(
      exceeded === 0
        ? "Todos os orçamentos dentro do limite."
        : `${exceeded} de ${input.budgets.length} ${plural(input.budgets.length, "orçamento", "orçamentos")} acima do limite.`
    )
  }

  if (input.goals.length > 0) {
    const average =
      input.goals.reduce((sum, g) => sum + GOAL_POINTS[getGoalStatus(g)], 0) / input.goals.length
    earned += average * SCORE_WEIGHTS.goals
    max += SCORE_WEIGHTS.goals

    const late = input.goals.filter((g) => getGoalStatus(g) === "atrasada").length
    highlights.push(
      late === 0 ? "Nenhuma meta atrasada." : `${late} ${plural(late, "meta atrasada", "metas atrasadas")}.`
    )
  }

  if (max === 0) return null

  const score = Math.round((earned / max) * 100)
  return { score, level: getScoreLevel(score), highlights }
}

// ---------- Análise de hábitos ----------

export type HabitInsight = {
  kind: "up" | "down"
  category: string
  // Variação em %, já arredondada (sempre positiva; "kind" diz o sentido).
  change: number
  // "em relação ao mês anterior" ou "em relação ao mesmo período do mês anterior".
  comparison: string
}

// Só vale como hábito uma variação de pelo menos 10% E de pelo menos R$ 20:
// sem isso, R$ 2 virando R$ 3 seria "+50%".
const MIN_CHANGE_PERCENT = 10
const MIN_CHANGE_AMOUNT = 20

// A categoria com a maior alta de gasto; se nenhuma subiu, a maior queda; senão null.
export function getHabitInsight(
  current: CategoryTotal[],
  previous: CategoryTotal[],
  partial: boolean
): HabitInsight | null {
  const previousById = new Map(previous.map((c) => [c.id, c.total]))
  const comparison = partial
    ? "em relação ao mesmo período do mês anterior"
    : "em relação ao mês anterior"

  let biggestUp: { category: string; change: number; diff: number } | null = null
  let biggestDown: { category: string; change: number; diff: number } | null = null

  for (const category of current) {
    const before = previousById.get(category.id)
    if (!before || before <= 0) continue

    const diff = category.total - before
    const change = (diff / before) * 100

    if (change >= MIN_CHANGE_PERCENT && diff >= MIN_CHANGE_AMOUNT) {
      if (!biggestUp || diff > biggestUp.diff) {
        biggestUp = { category: category.name, change, diff }
      }
    } else if (change <= -MIN_CHANGE_PERCENT && -diff >= MIN_CHANGE_AMOUNT) {
      if (!biggestDown || -diff > biggestDown.diff) {
        biggestDown = { category: category.name, change: -change, diff: -diff }
      }
    }
  }

  if (biggestUp) {
    return { kind: "up", category: biggestUp.category, change: Math.round(biggestUp.change), comparison }
  }
  if (biggestDown) {
    return { kind: "down", category: biggestDown.category, change: Math.round(biggestDown.change), comparison }
  }
  return null
}

// ---------- Sugestões de economia ----------

export type SavingsSuggestion = { title: string; detail: string }

const MAX_SUGGESTIONS = 4
const SUGGESTED_CUT_PERCENT = 10

// Texto que vai para a IA: só números reais do usuário. "" = nada a analisar.
export function buildSavingsSummary(input: {
  income: number
  expense: number
  categories: CategoryTotal[]
}): string {
  if (input.categories.length === 0) return ""

  const total = input.categories.reduce((sum, c) => sum + c.total, 0)
  const breakdown = input.categories
    .slice(0, 6)
    .map((c) => `${c.name}: ${c.total.toFixed(2)} (${total === 0 ? 0 : Math.round((c.total / total) * 100)}%)`)
    .join("; ")

  return `Receitas: ${input.income.toFixed(2)}; Despesas: ${input.expense.toFixed(2)}; Gastos por categoria: ${breakdown}`
}

// Sugestões por regras, usadas quando a IA falha ou ainda não respondeu:
// cortar 10% das categorias que mais pesam.
export function getSavingsFallback(categories: CategoryTotal[]): SavingsSuggestion[] {
  return categories
    .filter((c) => c.total > 0)
    .slice(0, MAX_SUGGESTIONS)
    .map((c) => ({
      title: `Reduzir ${SUGGESTED_CUT_PERCENT}% dos gastos com ${c.name}`,
      detail: `economia estimada de ${formatCurrency((c.total * SUGGESTED_CUT_PERCENT) / 100)}`,
    }))
}

// A IA responde "Título | detalhe", uma por linha. Aceita marcadores e numeração;
// linha sem "|" vira só título.
export function parseSavingsSuggestions(text: string): SavingsSuggestion[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s\-•*\d.)]+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|")
      if (separator === -1) return { title: line, detail: "" }
      return {
        title: line.slice(0, separator).trim(),
        detail: line.slice(separator + 1).trim(),
      }
    })
    .filter((suggestion) => suggestion.title !== "")
    .slice(0, MAX_SUGGESTIONS)
}

// ---------- Dica do dia ----------

export const DAILY_TIPS = [
  'Considere criar uma "Regra das 24 horas" para compras por impulso: antes de comprar algo supérfluo, espere um dia. Muita vontade passa sozinha.',
  "Pague-se primeiro: assim que a renda cair, separe o valor da meta de poupança e viva com o que sobrar.",
  "Revise suas assinaturas uma vez por mês. Serviços que você não usa há semanas são economia certa.",
  "Monte uma reserva de emergência de 3 a 6 meses de despesas essenciais antes de investir em produtos de risco.",
  "Compare o preço por quilo ou por litro, não só o da embalagem. A maior nem sempre é a mais barata.",
  "Antes de parcelar, some o total pago no fim. Parcelas pequenas escondem compromissos grandes no futuro.",
  "Defina um teto semanal para gastos variáveis, como lazer e delivery. Metas curtas são mais fáceis de cumprir que as mensais.",
]

// A mesma dica o dia inteiro, trocando à meia-noite (pelo calendário local da data recebida).
export function getDailyTip(date: Date): string {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return DAILY_TIPS[day % DAILY_TIPS.length]
}
