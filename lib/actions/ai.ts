"use server"

import { createClient } from "@/lib/supabase/server"
import { runInsight, type InsightDeps } from "@/lib/ai-insight"

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

export async function generateTipsReport(summary: string): Promise<string> {
  return runInsight(
    await realDeps(),
    (s) =>
      `Você é um assistente financeiro do app Fin+. Com base no resumo abaixo, escreva dicas práticas e específicas, em português, no formato "Tema: dica", uma por linha, usando apenas estes temas: Gastos, Orçamentos, Metas, Economia. Escreva uma linha por tema, cada dica com no máximo 25 palavras. Pule o tema que o resumo não permitir analisar. Sem numeração, sem marcadores e sem introdução.\n\nResumo:\n${s}`,
    summary,
    "dicas financeiras"
  )
}
