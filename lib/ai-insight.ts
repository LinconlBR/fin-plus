// Regras de proteção das Server Actions de IA, separadas da chamada ao Gemini
// e ao Supabase para poderem ser testadas sem rede. As dependências entram
// por parâmetro (injeção); lib/actions/ai.ts monta as reais.

// Teto do texto livre que o cliente manda. Os resumos reais têm algumas
// centenas de caracteres; o teto só existe para ninguém usar a action como
// um chat gratuito (cada chamada gasta cota paga).
export const MAX_SUMMARY_LENGTH = 4000

// Chamadas de IA por usuário por hora (a janela é controlada no banco).
export const AI_CALLS_PER_HOUR = 30

export type InsightDeps = {
  getUserId: () => Promise<string | null>
  consumeQuota: (maxCalls: number) => Promise<boolean>
  generate: (prompt: string) => Promise<string>
  logError: (message: string, error: unknown) => void
}

// Devolve "" em qualquer recusa ou falha: os componentes já tratam "" caindo
// no insight baseado em regras, então a tela nunca quebra por causa da IA.
export async function runInsight(
  deps: InsightDeps,
  buildPrompt: (summary: string) => string,
  summary: unknown,
  label: string
): Promise<string> {
  // Server Actions recebem JSON do cliente: o tipo declarado não é garantia.
  if (typeof summary !== "string" || summary.trim() === "") return ""

  try {
    const userId = await deps.getUserId()
    if (!userId) return ""

    // Falha fechada: se a checagem de cota der erro, não chama a IA.
    const allowed = await deps.consumeQuota(AI_CALLS_PER_HOUR)
    if (!allowed) return ""

    return await deps.generate(buildPrompt(summary.slice(0, MAX_SUMMARY_LENGTH)))
  } catch (error) {
    deps.logError(`Erro ao gerar ${label} com IA:`, error)
    return ""
  }
}
