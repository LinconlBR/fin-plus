"use server"

import { createClient } from "@/lib/supabase/server"
import { runInsight, type InsightDeps } from "@/lib/ai-insight"

import { canUseFeature } from "@/lib/plans"

import OpenAI from "openai"

const ai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 0,   // sem tentar de novo sozinho: falha rápido e cai no texto de regras
  timeout: 10_000, // desiste em 10 s
})

// Monta as dependências reais. Cada chamada cria seu próprio client do
// Supabase porque ele lê os cookies da requisição atual.
async function realDeps(): Promise<InsightDeps> {
  const supabase = await createClient()

  return {
    getUserId: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user?.id ?? null
    },
    // Hoje todo mundo é tratado como "free" e a trava está desligada (lib/plans.ts).
    // Quando existir a assinatura, o plano real entra aqui.
    hasAccess: async () => canUseFeature("free", "ai_insights"),
    consumeQuota: async (maxCalls) => {
      const { data, error } = await supabase.rpc("consume_ai_quota", {
        max_calls: maxCalls,
      })
      if (error) throw error
      return data === true
    },
    generate: async (prompt) => {
      const response = await ai.chat.completions.create({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      })
      return response.choices[0]?.message?.content ?? ""
    },
    logError: (message, error) => console.error(message, error),
  }
}

export async function generateDashboardTips(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Com base neste resumo do mês do usuário, escreva exatamente 3 dicas práticas e específicas, em português, uma por linha, cada uma com no máximo 20 palavras. Sem numeração, sem marcadores e sem introdução.\n\nResumo: ${s}`,
    summary,
    "dicas do dashboard"
  )
}

export async function generateBudgetInsight(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo de orçamentos do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e específico. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight"
  )
}

export async function generateGoalsInsight(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo das metas de economia do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e motivador. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight de metas"
  )
}

export async function generateOverviewInsight(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Baseado nesse resumo do período financeiro do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com uma observação prática e específica. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${s}`,
    summary,
    "insight da visão geral"
  )
}

export async function generateSavingsSuggestions(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Com base nos gastos reais do usuário abaixo, sugira exatamente 4 ações práticas de economia, em português, uma por linha, no formato "Título | detalhe". O título tem no máximo 8 palavras. O detalhe tem no máximo 10 palavras e, se citar um valor estimado, deve se basear apenas nos números do resumo (nunca invente valores). Sem numeração, sem marcadores e sem introdução.\n\nResumo: ${s}`,
    summary,
    "sugestões de economia"
  )
}
