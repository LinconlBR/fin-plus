import { describe, expect, it } from "vitest"
import { cellsToTable, cellToString } from "@/lib/spreadsheet"
import {
  buildImportRows,
  detectColumns,
  filterImportWindow,
  findHeaderRow,
} from "@/lib/transaction-import"

describe("cellToString", () => {
  it("converte vazio, texto, inteiro e decimal", () => {
    expect(cellToString(null)).toBe("")
    expect(cellToString(undefined)).toBe("")
    expect(cellToString("abc")).toBe("abc")
    expect(cellToString(42)).toBe("42")
    expect(cellToString(-1.5)).toBe("-1.50")
    expect(cellToString(1234.5)).toBe("1234.50")
  })
  it("converte datas pelos campos UTC, sem andar com o fuso", () => {
    expect(cellToString(new Date(Date.UTC(2026, 9, 11)))).toBe("2026-10-11")
    expect(cellToString(new Date(Date.UTC(2026, 0, 1, 23, 59)))).toBe("2026-01-01")
  })
})

describe("cellsToTable", () => {
  it("descarta linhas vazias", () => {
    expect(cellsToTable([[null, null], ["a", 1]])).toEqual([["a", "1"]])
  })
})

// Mesma estrutura do XLSX do Santander (Espanha): dados da conta antes da
// tabela, valores em texto com "€" e vírgula decimal. Dados fictícios.
describe("extrato XLSX do Santander (estrutura real)", () => {
  const sheet: unknown[][] = [
    [null, null, "Cuenta", "Fecha", null, null],
    [null, null, "ES00 0000 0000 0000 0000 0000", "12/10/2026 | 14:24:51", null, null],
    [null, null, "Titular", "Saldo", null, null],
    [null, null, "NOME FICTICIO", "854,97€ EUR", null, null],
    [null, null, null, null, null, null],
    ["Movimientos", null, null, null, null, null],
    [null, null, null, null, null, null],
    ["Fecha operación", "Fecha valor", "Concepto", "Importe", "Saldo", "Divisa"],
    ["11/10/2026", "11/10/2026", "PAGO MOVIL EN SUPERMERCADO, MADRID ES, TARJ. :*000000", "-1,97€", "950,97€", "EUR"],
    ["07/10/2026", "05/10/2026", "COMPRA LOJA, DUBLIN, TARJETA 0000 , COMISION 0,00", "-27,02€", "964,99€", "EUR"],
    ["06/10/2026", "06/10/2026", "TRANSFERENCIA DE EMPRESA, S.L., CONCEPTO NOMINA.", "1.302,71€", "1.394,26€", "EUR"],
    ["04/10/2026", "04/10/2026", "BIZUM DE AMIGO CONCEPTO X", "50,00€", "113,16€", "EUR"],
  ]
  const table = cellsToTable(sheet)

  it("acha o cabeçalho depois dos dados da conta", () => {
    expect(table[findHeaderRow(table)][0]).toBe("Fecha operación")
  })
  it("mapeia data de operação, concepto e importe (ignora saldo e data valor)", () => {
    expect(detectColumns(table[findHeaderRow(table)])).toEqual({ date: 0, description: 2, amount: 3 })
  })
  it("lê valores, datas e tipos corretamente", () => {
    const header = findHeaderRow(table)
    const { rows, issues } = buildImportRows(table, header, detectColumns(table[header]))
    expect(issues).toEqual([])
    expect(rows.map((r) => [r.date, r.type, r.amount])).toEqual([
      ["2026-10-11", "expense", 1.97],
      ["2026-10-07", "expense", 27.02],
      ["2026-10-06", "income", 1302.71],
      ["2026-10-04", "income", 50],
    ])
  })
  it("mantém tudo dentro da janela de 3 meses", () => {
    const header = findHeaderRow(table)
    const { rows } = buildImportRows(table, header, detectColumns(table[header]))
    const result = filterImportWindow(rows, new Date(2026, 9, 12))
    expect(result.inside).toHaveLength(4)
  })
})
