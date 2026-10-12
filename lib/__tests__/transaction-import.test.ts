import { describe, expect, it } from "vitest"
import {
  buildImportRows,
  detectColumns,
  duplicateKey,
  filterImportWindow,
  findHeaderRow,
  isMappingUsable,
  markDuplicates,
  monthsAgo,
  parseAmount,
  parseDate,
  parseTypeCell,
} from "@/lib/transaction-import"

describe("parseAmount", () => {
  it.each([
    ["10", 10],
    ["10,50", 10.5],
    ["10.50", 10.5],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["1.234", 1234],
    ["1.234.567,89", 1234567.89],
    ["-10,00", -10],
    ["- 10,00", -10],
    ["+10,00", 10],
    ["(10,00)", -10],
    ["10,00-", -10],
    ["R$ 1.500,00", 1500],
    ["-R$ 25,90", -25.9],
    ["€ 3,5", 3.5],
    ["  42 ", 42],
  ])("lê %j como %d", (raw, expected) => {
    expect(parseAmount(raw)).toBeCloseTo(expected, 2)
  })
  it.each(["", "   ", "abc", "R$", "-"])("devolve null para %j", (raw) => {
    expect(parseAmount(raw)).toBeNull()
  })
})

describe("parseDate", () => {
  it.each([
    ["10/10/2026", "2026-10-10"],
    ["1/2/2026", "2026-02-01"],
    ["10-10-2026", "2026-10-10"],
    ["10.10.2026", "2026-10-10"],
    ["10/10/26", "2026-10-10"],
    ["2026-10-10", "2026-10-10"],
    ["2026-10-10T08:30:00Z", "2026-10-10"],
    ["10/10/2026 14:22", "2026-10-10"],
    ["2026/1/5", "2026-01-05"],
  ])("lê %j como %s", (raw, expected) => {
    expect(parseDate(raw)).toBe(expected)
  })
  it.each(["", "31/02/2026", "32/01/2026", "10/13/2026", "ontem", "2026-13-01"])(
    "rejeita %j",
    (raw) => {
      expect(parseDate(raw)).toBeNull()
    }
  )
  it("aceita 29/02 só em ano bissexto", () => {
    expect(parseDate("29/02/2028")).toBe("2028-02-29")
    expect(parseDate("29/02/2027")).toBeNull()
  })
})

describe("detectColumns", () => {
  it("reconhece cabeçalho em português", () => {
    expect(detectColumns(["Data", "Descrição", "Valor"])).toEqual({ date: 0, description: 1, amount: 2 })
  })
  it("reconhece débito e crédito separados", () => {
    expect(detectColumns(["Data", "Histórico", "Débito", "Crédito", "Saldo"])).toEqual({
      date: 0, description: 1, debit: 2, credit: 3,
    })
  })
  it("reconhece cabeçalho em inglês e espanhol", () => {
    expect(detectColumns(["Date", "Description", "Amount"])).toEqual({ date: 0, description: 1, amount: 2 })
    expect(detectColumns(["Fecha", "Concepto", "Importe"])).toEqual({ date: 0, description: 1, amount: 2 })
  })
  it("reconhece cabeçalhos com complemento", () => {
    expect(detectColumns(["Data do lançamento", "Descrição", "Valor (R$)"])).toEqual({
      date: 0, description: 1, amount: 2,
    })
  })
  it("reconhece o formato exportado pelo Fin+", () => {
    expect(detectColumns(["Data", "Descrição", "Categoria", "Tipo", "Valor"])).toEqual({
      date: 0, description: 1, type: 3, amount: 4,
    })
  })
  it("não mapeia colunas desconhecidas", () => {
    expect(detectColumns(["foo", "bar"])).toEqual({})
  })
})

describe("isMappingUsable / findHeaderRow", () => {
  it("exige data e algum valor", () => {
    expect(isMappingUsable({ date: 0, amount: 1 })).toBe(true)
    expect(isMappingUsable({ date: 0, debit: 1 })).toBe(true)
    expect(isMappingUsable({ date: 0 })).toBe(false)
    expect(isMappingUsable({ amount: 1 })).toBe(false)
  })
  it("pula linhas de cabeçalho do banco antes da tabela", () => {
    const table = [["Extrato conta corrente"], ["Agência 1234"], ["Data", "Descrição", "Valor"], ["01/10/2026", "x", "1"]]
    expect(findHeaderRow(table)).toBe(2)
  })
  it("devolve -1 quando não acha cabeçalho", () => {
    expect(findHeaderRow([["a", "b"], ["1", "2"]])).toBe(-1)
  })
})

describe("parseTypeCell", () => {
  it.each([["Receita", "income"], ["ENTRADA", "income"], ["C", "income"], ["Despesa", "expense"], ["Saída", "expense"], ["D", "expense"]])(
    "lê %j",
    (raw, expected) => expect(parseTypeCell(raw)).toBe(expected)
  )
  it("devolve null para o desconhecido", () => {
    expect(parseTypeCell("talvez")).toBeNull()
  })
})

describe("buildImportRows", () => {
  it("usa o sinal do valor para definir receita ou despesa", () => {
    const table = [["Data", "Descrição", "Valor"], ["01/10/2026", "Salário", "5.000,00"], ["02/10/2026", "Mercado", "-120,50"]]
    const { rows, issues } = buildImportRows(table, 0, { date: 0, description: 1, amount: 2 })
    expect(issues).toEqual([])
    expect(rows).toEqual([
      { date: "2026-10-01", description: "Salário", amount: 5000, type: "income" },
      { date: "2026-10-02", description: "Mercado", amount: 120.5, type: "expense" },
    ])
  })
  it("combina colunas de débito e crédito", () => {
    const table = [["Data", "Hist", "Débito", "Crédito"], ["01/10/2026", "Luz", "80,00", ""], ["02/10/2026", "Pix", "", "30,00"]]
    const { rows } = buildImportRows(table, 0, { date: 0, description: 1, debit: 2, credit: 3 })
    expect(rows.map((r) => [r.type, r.amount])).toEqual([["expense", 80], ["income", 30]])
  })
  it("a coluna de tipo ganha do sinal", () => {
    const table = [["Data", "Desc", "Tipo", "Valor"], ["01/10/2026", "Café", "Despesa", "5,00"]]
    const { rows } = buildImportRows(table, 0, { date: 0, description: 1, type: 2, amount: 3 })
    expect(rows[0].type).toBe("expense")
  })
  it("relata linhas inválidas com o número da linha no arquivo", () => {
    const table = [["Data", "Desc", "Valor"], ["xx", "a", "1"], ["01/10/2026", "b", "abc"], ["01/10/2026", "c", "0"], ["01/10/2026", "d", "1"]]
    const { rows, issues } = buildImportRows(table, 0, { date: 0, description: 1, amount: 2 })
    expect(rows).toHaveLength(1)
    expect(issues).toEqual([
      { line: 2, reason: "Data inválida" },
      { line: 3, reason: "Valor inválido" },
      { line: 4, reason: "Valor zerado" },
    ])
  })
  it("limpa descrição, usa fallback e limita o tamanho", () => {
    const table = [["Data", "Desc", "Valor"], ["01/10/2026", "  muito   espaço ", "1"], ["01/10/2026", "", "1"], ["01/10/2026", "x".repeat(300), "1"]]
    const { rows } = buildImportRows(table, 0, { date: 0, description: 1, amount: 2 })
    expect(rows[0].description).toBe("muito espaço")
    expect(rows[1].description).toBe("Sem descrição")
    expect(rows[2].description).toHaveLength(200)
  })
  it("respeita o índice do cabeçalho", () => {
    const table = [["Banco X"], ["Data", "Desc", "Valor"], ["01/10/2026", "a", "1"]]
    expect(buildImportRows(table, 1, { date: 0, description: 1, amount: 2 }).rows).toHaveLength(1)
  })
})

describe("monthsAgo / filterImportWindow", () => {
  it("volta N meses mantendo o dia", () => {
    expect(monthsAgo(new Date(2026, 9, 12), 3)).toBe("2026-07-12")
  })
  it("cruza o ano", () => {
    expect(monthsAgo(new Date(2026, 1, 10), 3)).toBe("2025-11-10")
  })
  it("usa o último dia quando o mês de destino é mais curto", () => {
    expect(monthsAgo(new Date(2026, 4, 31), 3)).toBe("2026-02-28")
    expect(monthsAgo(new Date(2028, 4, 31), 3)).toBe("2028-02-29")
  })
  it("separa dentro da janela, antes e futuro", () => {
    const today = new Date(2026, 9, 12)
    const mk = (date: string) => ({ date, description: "x", amount: 1, type: "expense" as const })
    const result = filterImportWindow([mk("2026-07-11"), mk("2026-07-12"), mk("2026-10-12"), mk("2026-10-13")], today)
    expect(result.inside.map((r) => r.date)).toEqual(["2026-07-12", "2026-10-12"])
    expect(result.before).toBe(1)
    expect(result.future).toBe(1)
  })
})

describe("markDuplicates", () => {
  const base = { date: "2026-10-01", description: "Mercado Extra", amount: 50, type: "expense" as const }
  it("ignora maiúsculas, acentos e espaços na descrição", () => {
    expect(duplicateKey(base)).toBe(duplicateKey({ ...base, description: "  MERCADO  éxtra " }))
  })
  it("marca como duplicada a que já existe", () => {
    const [row] = markDuplicates([base], [base])
    expect(row.duplicate).toBe(true)
  })
  it("não marca quando valor, tipo ou data diferem", () => {
    expect(markDuplicates([{ ...base, amount: 51 }], [base])[0].duplicate).toBe(false)
    expect(markDuplicates([{ ...base, type: "income" as const }], [base])[0].duplicate).toBe(false)
    expect(markDuplicates([{ ...base, date: "2026-10-02" }], [base])[0].duplicate).toBe(false)
  })
  it("compras idênticas no arquivo só são duplicadas até o limite do que existe", () => {
    const result = markDuplicates([base, base, base], [base])
    expect(result.map((r) => r.duplicate)).toEqual([true, false, false])
  })
})
