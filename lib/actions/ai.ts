"use server"

import { runInsight } from "@/lib/ai-insight"
import { buildInsightDeps } from "@/lib/ai-deps"

export async function generateDashboardTips(summary: string): Promise<string> {
  return runInsight(
    await buildInsightDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Com base neste resumo do mês do usuário, escreva exatamente 3 dicas práticas e específicas, em português, uma por linha, cada uma com no máximo 20 palavras. Sem numeração, sem marcadores e sem introdução.\n\nResumo: ${s}`,
    summary,
    "dicas do dashboard"
  )
}

export async function generateBudgetInsight(summary: string): Promise<string> {
  return runInsight(
    await buildInsightDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo de orçamentos do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e específico. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight"
  )
}

export async function generateGoalsInsight(summary: string): Promise<string> {
  return runInsight(
    await buildInsightDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo das metas de economia do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e motivador. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight de metas"
  )
}

export async function generateOverviewInsight(summary: string): Promise<string> {
  return runInsight(
    await buildInsightDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo do período financeiro do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com uma observação prática e específica. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight da visão geral"
  )
}

export async function generateSavingsSuggestions(summary: string): Promise<string> {
  return runInsight(
    await buildInsightDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Com base nos gastos reais do usuário abaixo, sugira exatamente 4 ações práticas de economia, em português, uma por linha, no formato "Título | detalhe". O título tem no máximo 8 palavras. O detalhe tem no máximo 10 palavras e, se citar um valor estimado, deve se basear apenas nos números do resumo (nunca invente valores). Sem numeração, sem marcadores e sem introdução.\n\nResumo: ${s}`,
    summary,
    "sugestões de economia"
  )
}
