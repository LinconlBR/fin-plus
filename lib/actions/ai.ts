"use server"

import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function generateBudgetInsight(summary: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um assistente financeiro do app Fin+. Baseado nesse resumo de orçamentos do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e específico. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${summary}`,
    })

    return response.text ?? ""
  } catch (error) {
    // Se a IA falhar (rede, chave inválida, limite excedido), não quebra a
    // tela — só devolve vazio, e o componente cai de volta pro insight
    // baseado em regras como fallback.
    console.error("Erro ao gerar insight com IA:", error)
    return ""
  }
}

export async function generateGoalsInsight(summary: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um assistente financeiro do app Fin+. Baseado nesse resumo das metas de economia do usuário, escreva UMA frase curta (máximo 2 linhas), em português, com um conselho prático e motivador. Não use saudação nem introdução, só a frase direto.\n\nResumo: ${summary}`,
    })

    return response.text ?? ""
  } catch (error) {
    console.error("Erro ao gerar insight de metas com IA:", error)
    return ""
  }
}