import { describe, expect, it, vi } from "vitest"
import { MAX_SUMMARY_LENGTH, runInsight, type InsightDeps } from "@/lib/ai-insight"

const build = (over: Partial<InsightDeps> = {}): InsightDeps => ({
  getUserId: async () => "user-1",
  consumeQuota: async () => true,
  generate: async () => "dica",
  logError: vi.fn(),
  ...over,
})

const prompt = (s: string) => s

describe("runInsight", () => {
  it("devolve o texto da IA no caminho feliz", async () => {
    expect(await runInsight(build(), prompt, "resumo", "teste")).toBe("dica")
  })

  it("devolve vazio quando não há usuário logado", async () => {
    const generate = vi.fn(async () => "dica")
    const deps = build({ getUserId: async () => null, generate })
    expect(await runInsight(deps, prompt, "resumo", "teste")).toBe("")
    expect(generate).not.toHaveBeenCalled()
  })

  it("devolve vazio e não chama a IA quando a cota acabou", async () => {
    const generate = vi.fn(async () => "dica")
    const deps = build({ consumeQuota: async () => false, generate })
    expect(await runInsight(deps, prompt, "resumo", "teste")).toBe("")
    expect(generate).not.toHaveBeenCalled()
  })

  it("falha fechada: erro na checagem de cota não chama a IA", async () => {
    const generate = vi.fn(async () => "dica")
    const logError = vi.fn()
    const deps = build({
      consumeQuota: async () => {
        throw new Error("db fora do ar")
      },
      generate,
      logError,
    })
    expect(await runInsight(deps, prompt, "resumo", "teste")).toBe("")
    expect(generate).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledTimes(1)
  })

  it("corta o resumo em MAX_SUMMARY_LENGTH antes de montar o prompt", async () => {
    const generate = vi.fn(async (p: string) => p)
    const deps = build({ generate })
    const result = await runInsight(deps, prompt, "a".repeat(MAX_SUMMARY_LENGTH + 500), "teste")
    expect(result).toHaveLength(MAX_SUMMARY_LENGTH)
  })

  it.each([123, null, undefined, {}, ["x"]])(
    "ignora resumo que não é string (%j) sem tocar em nada",
    async (value) => {
      const getUserId = vi.fn(async () => "user-1")
      const deps = build({ getUserId })
      expect(await runInsight(deps, prompt, value, "teste")).toBe("")
      expect(getUserId).not.toHaveBeenCalled()
    }
  )

  it("ignora resumo em branco", async () => {
    const getUserId = vi.fn(async () => "user-1")
    const deps = build({ getUserId })
    expect(await runInsight(deps, prompt, "   \n ", "teste")).toBe("")
    expect(getUserId).not.toHaveBeenCalled()
  })

  it("registra o erro e devolve vazio quando a IA falha", async () => {
    const logError = vi.fn()
    const deps = build({
      generate: async () => {
        throw new Error("timeout")
      },
      logError,
    })
    expect(await runInsight(deps, prompt, "resumo", "metas")).toBe("")
    expect(logError).toHaveBeenCalledWith("Erro ao gerar metas com IA:", expect.any(Error))
  })
})