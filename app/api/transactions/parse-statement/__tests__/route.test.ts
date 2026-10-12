import { beforeEach, describe, expect, it, vi } from "vitest"
import { jsPDF } from "jspdf"

import { buildTransactionsPdf } from "@/lib/transaction-pdf"

const state = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  generate: vi.fn<(prompt: string) => Promise<string>>(async () => ""),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({ select: async () => ({ data: [{ name: "Alimentação" }, { name: "Salário" }, { name: "Lazer" }] }) }),
  }),
}))

vi.mock("@/lib/ai-deps", () => ({
  buildInsightDeps: async () => ({
    getUserId: async () => "user-1",
    hasAccess: async () => true,
    consumeQuota: async () => true,
    generate: state.generate,
    logError: () => undefined,
  }),
}))

import { POST } from "../route"

function pdfFromLines(lines: string[]): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  doc.setFontSize(9)
  lines.forEach((line, i) => doc.text(line, 40, 40 + i * 14))
  return new Uint8Array(doc.output("arraybuffer"))
}

function request(bytes: Uint8Array | null, name = "extrato.pdf"): Request {
  const form = new FormData()
  if (bytes) form.append("file", new File([bytes as BlobPart], name, { type: "application/pdf" }))
  return new Request("http://localhost/api/transactions/parse-statement", { method: "POST", body: form })
}

beforeEach(() => {
  state.user = { id: "user-1" }
  state.generate = vi.fn(async () => "")
})

describe("POST /api/transactions/parse-statement", () => {
  it("recusa quem não está logado", async () => {
    state.user = null
    expect((await POST(request(pdfFromLines(["x"])))).status).toBe(401)
  })

  it("recusa requisição sem arquivo", async () => {
    expect((await POST(request(null))).status).toBe(400)
  })

  it("recusa arquivo que não é PDF, mesmo com extensão .pdf", async () => {
    const fake = new TextEncoder().encode("isto não é um pdf, só tem o nome")
    expect((await POST(request(fake))).status).toBe(400)
  })

  it("recusa PDF grande demais", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1)
    big.set(new TextEncoder().encode("%PDF-"))
    expect((await POST(request(big))).status).toBe(413)
  })

  it("recusa PDF sem texto (escaneado)", async () => {
    const empty = new Uint8Array(new jsPDF().output("arraybuffer"))
    const response = await POST(request(empty))
    expect(response.status).toBe(422)
    expect((await response.json()).error).toMatch(/escaneado/)
  })

  it("lê pelas regras o layout estilo Santander, sem chamar a IA", async () => {
    const bytes = pdfFromLines([
      "Titular: Nome Ficticio",
      "Cuenta: ES00 0000 0000 0000 0000 0000",
      "Movimientos de tu cuenta",
      "Fecha operacion Operacion Importe Saldo",
      "11 oct 2026",
      "F. valor: 11 oct 2026",
      "Pago Movil En Dia 9419, Madrid Es -1,97 EUR 950,97 EUR",
      "06 oct 2026",
      "F. valor: 06 oct 2026",
      "Transferencia De Empresa, S.L., Concepto Nomina. 1.302,71 EUR 1.394,26 EUR",
      "05 oct 2026",
      "F. valor: 05 oct 2026",
      "Pago Movil En Mercadona, Madrid Es -21,61 EUR 91,55 EUR",
    ])
    const response = await POST(request(bytes))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.method).toBe("rules")
    expect(body.rows.map((r: { type: string; amount: number }) => [r.type, r.amount])).toEqual([
      ["expense", 1.97], ["income", 1302.71], ["expense", 21.61],
    ])
    expect(state.generate).not.toHaveBeenCalled()
  })

  it("lê de volta o PDF exportado pelo próprio Fin+, trazendo as categorias", async () => {
    const bytes = new Uint8Array(
      buildTransactionsPdf(
        [
          { date: "2026-10-12", description: "supermercado", category: "Alimentação", type: "expense", amount: 50 },
          { date: "2026-09-30", description: "Salario", category: "Salário", type: "income", amount: 1300 },
        ],
        { from: "2026-09-01", to: "2026-10-12" }
      )
    )
    const body = await (await POST(request(bytes))).json()
    expect(body.method).toBe("rules")
    expect(body.rows).toEqual([
      { date: "2026-10-12", description: "supermercado", amount: 50, type: "expense", categoryName: "Alimentação" },
      { date: "2026-09-30", description: "Salario", amount: 1300, type: "income", categoryName: "Salário" },
    ])
  })

  it("usa a IA para layout desconhecido, sem enviar dados pessoais", async () => {
    state.generate = vi.fn(async () => '[{"date":"2026-10-10","description":"Padaria","amount":-12.5}]')
    const bytes = pdfFromLines([
      "Account holder: Fulano de Tal",
      "IBAN ES4700491555142810521451",
      "Compra Padaria | 10 Out | EUR 12.50 DEBIT",
      "Pagamento recebido | 09 Out | EUR 100.00 CREDIT",
    ])
    const response = await POST(request(bytes))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.method).toBe("ai")
    expect(body.notices.join(" ")).toMatch(/IA/)
    const prompt = state.generate.mock.calls[0][0]
    expect(prompt).toContain("Padaria")
    expect(prompt).not.toMatch(/Fulano de Tal|ES4700491555142810521451/)
  })

  it("devolve erro claro quando a IA não consegue", async () => {
    const bytes = pdfFromLines(["Compra Padaria | 10 Out | EUR 12.50 DEBIT", "Outra linha | 09 Out | EUR 100.00"])
    const response = await POST(request(bytes))
    expect(response.status).toBe(422)
    expect((await response.json()).error).toMatch(/CSV|XLSX/)
  })
})
