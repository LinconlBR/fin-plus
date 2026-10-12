import { describe, expect, it } from "vitest"
import { detectDelimiter, escapeCsvCell, parseCsv, toCsv } from "@/lib/csv"

describe("detectDelimiter", () => {
  it("detecta ponto e vírgula, vírgula e tabulação", () => {
    expect(detectDelimiter("a;b;c")).toBe(";")
    expect(detectDelimiter("a,b,c")).toBe(",")
    expect(detectDelimiter("a\tb\tc")).toBe("\t")
  })
  it("ignora separadores dentro de aspas", () => {
    expect(detectDelimiter('"a,b,c,d";x;y')).toBe(";")
  })
  it("usa ponto e vírgula quando não há separador", () => {
    expect(detectDelimiter("abc")).toBe(";")
  })
  it("ignora BOM e linhas vazias iniciais", () => {
    expect(detectDelimiter("﻿\n\na,b")).toBe(",")
  })
})

describe("parseCsv", () => {
  it("separa linhas e campos", () => {
    expect(parseCsv("a;b\r\n1;2\n3;4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]])
  })
  it("respeita aspas, separador e quebra de linha dentro do campo", () => {
    expect(parseCsv('a;"x;y";"l1\nl2"')).toEqual([["a", "x;y", "l1\nl2"]])
  })
  it("entende aspas escapadas", () => {
    expect(parseCsv('"ele disse ""oi"""')).toEqual([['ele disse "oi"']])
  })
  it("descarta linhas vazias e remove BOM", () => {
    expect(parseCsv("﻿a;b\n\n;\n1;2\n")).toEqual([["a", "b"], ["1", "2"]])
  })
  it("mantém campos vazios no meio", () => {
    expect(parseCsv("a;;c")).toEqual([["a", "", "c"]])
  })
  it("aceita último campo sem quebra de linha", () => {
    expect(parseCsv("a;b")).toEqual([["a", "b"]])
  })
  it("aceita delimitador informado", () => {
    expect(parseCsv("a,b;c", ",")).toEqual([["a", "b;c"]])
  })
})

describe("escapeCsvCell", () => {
  it("coloca aspas quando necessário", () => {
    expect(escapeCsvCell('a"b', ";")).toBe('"a""b"')
    expect(escapeCsvCell("a;b", ";")).toBe('"a;b"')
    expect(escapeCsvCell("a,b", ";")).toBe("a,b")
  })
  it.each(["=SOMA(A1)", "+1", "-1", "@cmd"])("neutraliza fórmula em texto (%s)", (text) => {
    expect(escapeCsvCell(text, ";")).toBe("'" + text)
  })
  it("não mexe em números negativos de verdade", () => {
    expect(escapeCsvCell(-10.5, ";")).toBe("-10.5")
  })
})

describe("toCsv", () => {
  it("gera BOM, CRLF e faz o round-trip com parseCsv", () => {
    const rows = [["Descrição", "Valor"], ['Café "bom"; grande', 12.5]]
    const csv = toCsv(rows)
    expect(csv.startsWith("﻿")).toBe(true)
    expect(csv).toContain("\r\n")
    expect(parseCsv(csv)).toEqual([["Descrição", "Valor"], ['Café "bom"; grande', "12.5"]])
  })
})
