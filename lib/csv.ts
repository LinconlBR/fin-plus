// Leitura e escrita de CSV sem dependências. Bancos exportam com ";" (Brasil e
// Espanha), "," ou tabulação, às vezes com BOM e com campos entre aspas.

export type CsvDelimiter = "," | ";" | "\t"

// Escolhe o separador que mais aparece fora de aspas na primeira linha com conteúdo.
export function detectDelimiter(text: string): CsvDelimiter {
  const firstLine =
    text
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .find((line) => line.trim() !== "") ?? ""

  const counts: Record<CsvDelimiter, number> = { ",": 0, ";": 0, "\t": 0 }
  let inQuotes = false
  for (const char of firstLine) {
    if (char === '"') inQuotes = !inQuotes
    else if (!inQuotes && char in counts) counts[char as CsvDelimiter]++
  }

  // Em empate (ou nenhum), ";" vence: é o mais comum nos bancos brasileiros.
  const order: CsvDelimiter[] = [";", ",", "\t"]
  return order.reduce((best, d) => (counts[d] > counts[best] ? d : best), order[0])
}

// Devolve as linhas já separadas em campos. Linhas totalmente vazias são descartadas.
export function parseCsv(text: string, delimiter?: CsvDelimiter): string[][] {
  const source = text.replace(/^﻿/, "")
  const sep = delimiter ?? detectDelimiter(source)

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  const endRow = () => {
    row.push(field)
    field = ""
    if (row.some((cell) => cell.trim() !== "")) rows.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === sep) {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      endRow()
    } else if (char === "\r") {
      if (source[i + 1] === "\n") i++
      endRow()
    } else {
      field += char
    }
  }
  if (field !== "" || row.length > 0) endRow()

  return rows
}

// Planilhas executam células de texto que começam com = + - @ como fórmula.
// Descrições vêm de fora (extratos, outras pessoas), então neutralizamos.
export function escapeCsvCell(value: string | number, delimiter: CsvDelimiter): string {
  let text = String(value)
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = "'" + text
  if (text.includes('"') || text.includes("\n") || text.includes("\r") || text.includes(delimiter)) {
    text = '"' + text.replace(/"/g, '""') + '"'
  }
  return text
}

// BOM no início faz o Excel abrir com acentos corretos.
export function toCsv(
  rows: (string | number)[][],
  delimiter: CsvDelimiter = ";"
): string {
  const body = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter))
    .join("\r\n")
  return "﻿" + body + "\r\n"
}
