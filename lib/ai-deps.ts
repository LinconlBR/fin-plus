// Dependências reais das chamadas de IA (Supabase + Groq). Fica fora de
// lib/actions/ai.ts porque um arquivo "use server" só pode exportar actions, e
// a leitura de extratos (Route Handler) precisa das mesmas dependências.
import { createClient } from "@/lib/supabase/server"
import { canUseFeature } from "@/lib/plans"
import type { InsightDeps } from "@/lib/ai-insight"

import OpenAI from "openai"

const ai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 0,   // sem tentar de novo sozinho: falha rápido e cai no texto de regras
  timeout: 10_000, // desiste em 10 s
})

// Monta as dependências reais. Cada chamada cria seu próprio client do
// Supabase porque ele lê os cookies da requisição atual.
export async function buildInsightDeps(maxTokens = 800): Promise<InsightDeps> {
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
        max_tokens: maxTokens,
      })
      return response.choices[0]?.message?.content ?? ""
    },
    logError: (message, error) => console.error(message, error),
  }
}

