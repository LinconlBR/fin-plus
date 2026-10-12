import { describe, expect, it, vi } from "vitest"
import { readStatement } from "@/lib/statement-reader"

const KNOWN = `Data Descrição Valor
10/10/2026 Compra A -10,00
09/10/2026 Compra B -20,00
08/10/2026 Pix recebido 30,00`

// Layout que as regras não entendem (data no fim da linha).
const UNKNOWN = `Extrato conta
Titular: Fulano de Tal
IBAN ES4700491555142810521451
Compra Padaria | 10 Out | EUR 12.50 DEBIT
Pagamento recebido | 09 Out | EUR 100.00 CREDIT`

describe("readStatement", () => {
  it("usa as regras quando o layout é reconhecido, sem chamar a IA", async () => {
    const askAi = vi.fn<(prompt: string) => Promise<string>>(async () => "[]")
    const result = await readStatement(KNOWN, { categoryNames: [], askAi })
    expect(result).toMatchObject({ ok: true, method: "rules" })
    expect(askAi).not.toHaveBeenCalled()
  })

  it("cai na IA quando as regras não reconhecem, enviando o texto sem dados pessoais", async () => {
    const askAi = vi.fn<(prompt: string) => Promise<string>>(async () => '[{"date":"2026-10-10","description":"Padaria","amount":-12.5}]')
    const result = await readStatement(UNKNOWN, { categoryNames: [], askAi })
    expect(result).toMatchObject({ ok: true, method: "ai" })
    const prompt = askAi.mock.calls[0][0]
    expect(prompt).toContain("Compra Padaria")
    expect(prompt).not.toMatch(/Fulano de Tal|ES4700491555142810521451/)
    if (result.ok) {
      expect(result.rows).toEqual([{ date: "2026-10-10", description: "Padaria", amount: 12.5, type: "expense" }])
      expect(result.notices.join(" ")).toMatch(/IA/)
    }
  })

  it("falha com mensagem útil quando a IA recusa ou falha (resposta vazia)", async () => {
    const result = await readStatement(UNKNOWN, { categoryNames: [], askAi: async () => "" })
    expect(result.ok).toBe(false)
  })

  it("falha quando a IA responde sem nenhum movimento válido", async () => {
    const result = await readStatement(UNKNOWN, { categoryNames: [], askAi: async () => "não sei" })
    expect(result.ok).toBe(false)
  })

  it("avisa sobre itens descartados da IA", async () => {
    const answer = '[{"date":"2026-10-10","description":"ok","amount":-1},{"date":"ruim","description":"x","amount":-1}]'
    const result = await readStatement(UNKNOWN, { categoryNames: [], askAi: async () => answer })
    expect(result.ok && result.notices.some((n) => /descartados/.test(n))).toBe(true)
  })
})
