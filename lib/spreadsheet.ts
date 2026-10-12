// Converte as células lidas de uma planilha (XLSX) no mesmo formato de texto
// que o parser de CSV produz, para o resto da importação não precisar saber a
// origem do arquivo.

// Planilhas guardam tipos reais: texto, número, data. O importador trabalha com
// texto, então cada tipo vira uma forma que ele entende sem ambiguidade.
export function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return ""
  if (cell instanceof Date) {
    // O leitor devolve datas em UTC; usar os campos UTC evita o dia andar com o fuso.
    const y = cell.getUTCFullYear()
    const m = String(cell.getUTCMonth() + 1).padStart(2, "0")
    const d = String(cell.getUTCDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  if (typeof cell === "number") {
    // "1.234" como texto seria lido como milhar; valores monetários têm 2 casas.
    return Number.isInteger(cell) ? String(cell) : cell.toFixed(2)
  }
  return String(cell)
}

// Linhas totalmente vazias são descartadas, como no CSV.
export function cellsToTable(rows: unknown[][]): string[][] {
  return rows
    .map((row) => row.map(cellToString))
    .filter((row) => row.some((cell) => cell.trim() !== ""))
}
