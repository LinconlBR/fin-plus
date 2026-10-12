import { describe, expect, it } from "vitest"
import {
  buildStatementPrompt,
  extractJsonArray,
  parseAiStatement,
  redactStatementText,
} from "@/lib/statement-ai"

describe("redactStatementText", () => {
  const text = `Titular: Fulano de Tal
Cuenta: ES00 0000 0000 0000 0000 0000
Saldo disponible: 854,97€
Fecha operación Operación Importe
11 oct 2026 Compra Loja, TARJETA 5489010515828919 , -5,00€
11 oct 2026 Transferencia a ES4700491555142810521451 -10,00€
Contacto: fulano@email.com`

  it("remove titular, conta, IBAN, cartão e e-mail", () => {
    const out = redactStatementText(text)
    expect(out).not.toMatch(/Fulano de Tal/)
    expect(out).not.toMatch(/ES00 0000/)
    expect(out).not.toMatch(/5489010515828919/)
    expect(out).not.toMatch(/ES4700491555142810521451/)
    expect(out).not.toMatch(/fulano@email\.com/)
  })
  it("mantém data, descrição, valores e saldo", () => {
    const out = redactStatementText(text)
    expect(out).toContain("11 oct 2026 Compra Loja")
    expect(out).toContain("-5,00€")
    expect(out).toContain("854,97€")
  })
  it("não apaga valores normais nem datas", () => {
    expect(redactStatementText("10/10/2026 Padaria -1.234,56")).toBe("10/10/2026 Padaria -1.234,56")
  })
})

describe("buildStatementPrompt", () => {
  it("inclui o texto e as regras de sinal", () => {
    const prompt = buildStatementPrompt("TEXTO_X")
    expect(prompt).toContain("TEXTO_X")
    expect(prompt).toContain("NEGATIVO")
  })
})

describe("extractJsonArray", () => {
  it("lê array puro, com cerca de markdown e com texto em volta", () => {
    expect(extractJsonArray('[{"a":1}]')).toEqual([{ a: 1 }])
    expect(extractJsonArray('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }])
    expect(extractJsonArray('Aqui está: [{"a":1}] pronto')).toEqual([{ a: 1 }])
  })
  it("devolve null para o que não é JSON de array", () => {
    expect(extractJsonArray("sem json")).toBeNull()
    expect(extractJsonArray("[{quebrado")).toBeNull()
    expect(extractJsonArray("")).toBeNull()
  })
})

describe("parseAiStatement", () => {
  it("converte sinal em tipo e usa valor absoluto", () => {
    const raw = '[{"date":"2026-10-11","description":"Padaria","amount":-12.5},{"date":"2026-10-06","description":"Salário","amount":1302.71}]'
    expect(parseAiStatement(raw).rows).toEqual([
      { date: "2026-10-11", description: "Padaria", amount: 12.5, type: "expense" },
      { date: "2026-10-06", description: "Salário", amount: 1302.71, type: "income" },
    ])
  })
  it("descarta linhas inválidas e conta quantas", () => {
    const raw = JSON.stringify([
      { date: "2026-10-11", description: "ok", amount: -1 },
      { date: "ontem", description: "data ruim", amount: -1 },
      { date: "2026-10-11", description: "zero", amount: 0 },
      { date: "2026-10-11", description: "texto", amount: "10" },
      { description: "sem data", amount: 5 },
      "lixo",
      null,
    ])
    const result = parseAiStatement(raw)
    expect(result.rows).toHaveLength(1)
    expect(result.dropped).toBe(6)
  })
  it("aceita datas em formatos comuns e limpa a descrição", () => {
    const raw = '[{"date":"11/10/2026","description":"  muito   espaço ","amount":-3}]'
    expect(parseAiStatement(raw).rows[0]).toMatchObject({ date: "2026-10-11", description: "muito espaço" })
  })
  it("resposta que não é JSON vira lista vazia", () => {
    expect(parseAiStatement("Desculpe, não consegui")).toEqual({ rows: [], dropped: 0 })
  })
})
