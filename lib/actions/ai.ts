"use server"

import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"
import { runInsight, type InsightDeps } from "@/lib/ai-insight"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      })
      return response.text ?? ""
    },
    logError: (message, error) => console.error(message, error),
  }
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
