import { getGoalStatus } from "@/lib/goals"
import type { GoalWithProgress } from "@/hooks/use-goals"

// Os temas da página de Dicas, na ordem em que aparecem.
export const TIP_TOPICS = ["Gastos", "Orçamentos", "Metas", "Economia"] as const
export type TipTopic = (typeof TIP_TOPICS)[number]

export type Tip = { topic: TipTopic; text: string }

// "Orçamentos" e "orcamentos" viram a mesma chave: a IA nem sempre acentua.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

const topicByKey = new Map<string, TipTopic>(TIP_TOPICS.map((t) => [normalize(t), t]))

// A resposta da IA é texto livre. Esperamos uma linha por tema no formato
// "Tema: dica"; aceitamos também marcadores, numeração e "-" ou "|" no lugar do ":".
// Linhas fora do formato são ignoradas e cada tema aparece no máximo uma vez.
export function parseTipsReport(text: string): Tip[] {
  const found = new Map<TipTopic, string>()

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/^[\s\-•*\d.)]+/, "").replace(/\*\*/g, "")
    const match = line.match(/^([^:|\-–—]+?)\s*[:|\-–—]\s*(.+)$/)
    if (!match) continue

    const topic = topicByKey.get(normalize(match[1].trim()))
    const tip = match[2].trim()
    if (topic && tip && !found.has(topic)) found.set(topic, tip)
  }

  return TIP_TOPICS.filter((topic) => found.has(topic)).map((topic) => ({
    topic,
    text: found.get(topic)!,
  }))
}

// Junta as partes disponíveis no texto que vai para a IA. Partes vazias ficam de fora,
// e é isso que permite à IA pular os temas sem dados.
export function buildTipsSummary(parts: {
  overview: string
  budgets: string
  goals: string
}): string {
  return [
    parts.overview && `Visão geral do mês: ${parts.overview}`,
    parts.budgets && `Orçamentos: ${parts.budgets}`,
    parts.goals && `Metas: ${parts.goals}`,
  ]
    .filter(Boolean)
    .join("\n")
}

// Dica por regras para metas, usada quando a IA falha ou ainda não respondeu.
export function getGoalsFallbackTip(goals: GoalWithProgress[]): string {
  if (goals.length === 0) return ""

  const late = goals.find((goal) => getGoalStatus(goal) === "atrasada")
  if (late) {
    return `Sua meta "${late.name}" está atrasada em relação ao prazo. Considere aumentar suas contribuições.`
  }
  if (goals.every((goal) => getGoalStatus(goal) === "concluida")) {
    return "Parabéns! Todas as suas metas estão concluídas."
  }
  return "Suas metas estão no ritmo certo. Continue assim!"
}
