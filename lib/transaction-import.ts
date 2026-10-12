// Transforma as linhas cruas de um CSV de extrato em transações do Fin+.
// Tudo aqui é lógica pura (sem rede, sem banco) para ser testável. A leitura do
// arquivo está em lib/csv.ts e a gravação em lib/actions/transactions-import.ts.

import { toDateString } from "@/lib/reports"
import { extractMerchantKey } from "@/lib/merchant"

export type TransactionType = "income" | "expense"

export type ImportRow = {
  date: string // YYYY-MM-DD
  description: string
  amount: number // sempre positivo; o sinal vira "type"
  type: TransactionType
  // Nome da categoria quando o próprio arquivo traz uma (ex.: exportação do Fin+).
  categoryName?: string
}

// ---------- Valores ----------

// Aceita "1.234,56", "1,234.56", "-R$ 10,00", "(10,00)", "10,00-", "R$10".
// Devolve o número com sinal, ou null se não for um valor.
export function parseAmount(raw: string): number | null {
  let text = raw.trim()
  if (text === "") return null

  let negative = false
  if (/^\(.*\)$/.test(text)) {
    negative = true
    text = text.slice(1, -1)
  }
  if (/-\s*$/.test(text)) {
    negative = true
    text = text.replace(/-\s*$/, "")
  }
  if (/^\s*-/.test(text)) negative = true
  text = text.replace(/^\s*[-+]/, "")

  // Só dígitos e separadores a partir daqui (remove R$, €, espaços, "D"/"C").
  text = text.replace(/[^\d.,]/g, "")
  if (text === "" || !/\d/.test(text)) return null

  const lastDot = text.lastIndexOf(".")
  const lastComma = text.lastIndexOf(",")
  const decimalIndex = Math.max(lastDot, lastComma)

  let normalized: string
  if (decimalIndex === -1) {
    normalized = text
  } else {
    const decimals = text.length - decimalIndex - 1
    const separator = text[decimalIndex]
    const otherSeparator = separator === "." ? "," : "."
    const separatorCount = text.split(separator).length - 1
    // "1.234" (um separador, 3 dígitos depois) é milhar; "1.234,56" é decimal.
    const isThousands =
      separatorCount > 1 || (decimals === 3 && !text.includes(otherSeparator))
    if (isThousands) {
      normalized = text.replace(/[.,]/g, "")
    } else {
      normalized =
        text.slice(0, decimalIndex).replace(/[.,]/g, "") + "." + text.slice(decimalIndex + 1)
    }
  }

  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return negative ? -value : value
}

// ---------- Datas ----------

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

// Aceita dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa, dd/mm/aa e aaaa-mm-dd (com ou sem
// hora depois). Devolve "YYYY-MM-DD" ou null. Datas ambíguas são lidas como
// dia/mês, o padrão dos bancos brasileiros e europeus.
export function parseDate(raw: string): string | null {
  const text = raw.trim()

  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(text)
  if (iso) {
    const [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    return isRealDate(year, month, day) ? `${year}-${pad(month)}-${pad(day)}` : null
  }

  const dmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[T\s].*)?$/.exec(text)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3])
    return isRealDate(year, month, day) ? `${year}-${pad(month)}-${pad(day)}` : null
  }

  // Mês por extenso/abreviado: "11 oct 2026", "11 de outubro de 2026", "Oct 11, 2026".
  const named = /^(\d{1,2})\s+(?:de\s+)?([a-zà-ÿ]+)\.?\s+(?:de\s+)?(\d{4})$/i.exec(text)
  if (named) {
    const month = monthFromName(named[2])
    const day = Number(named[1])
    const year = Number(named[3])
    if (month && isRealDate(year, month, day)) return `${year}-${pad(month)}-${pad(day)}`
  }

  return null
}

// Prefixos de 3 letras de meses em espanhol, português e inglês.
const MONTH_PREFIXES: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, fev: 2, mar: 3, abr: 4, apr: 4, may: 5, mai: 5,
  jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, out: 10,
  nov: 11, dic: 12, dez: 12, dec: 12,
}

function monthFromName(name: string): number | null {
  const key = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 3)
  return MONTH_PREFIXES[key] ?? null
}

// ---------- Colunas ----------

export type ColumnField = "date" | "description" | "amount" | "debit" | "credit" | "type" | "category"

export type ColumnMapping = Partial<Record<ColumnField, number>>

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const HEADER_HINTS: Record<ColumnField, string[]> = {
  date: ["data", "date", "fecha", "dt", "data lancamento", "data movimento", "fecha operacion"],
  description: [
    "descricao", "description", "historico", "lancamento", "memo", "detalhe",
    "detalhes", "concepto", "estabelecimento", "title", "titulo", "movimento",
  ],
  amount: ["valor", "amount", "importe", "montante", "value", "quantia"],
  debit: ["debito", "debit", "saida", "saidas", "cargo", "retirada", "despesa"],
  credit: ["credito", "credit", "entrada", "entradas", "abono", "deposito", "receita"],
  type: ["tipo", "type", "natureza", "d c", "dc"],
  category: ["categoria", "category", "categoria do gasto"],
}

function matchesHint(header: string, hints: string[]): number {
  if (hints.includes(header)) return 2
  // "Data do lançamento", "Valor (R$)": começa com a dica como palavra inteira.
  if (hints.some((hint) => header.startsWith(hint + " "))) return 1
  return 0
}

// Sugere qual coluna é qual a partir do cabeçalho. A pessoa pode corrigir na tela.
export function detectColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const mapping: ColumnMapping = {}
  const used = new Set<number>()

  // Ordem importa: campos mais específicos primeiro, para "tipo" não roubar "data".
  const order: ColumnField[] = ["date", "amount", "debit", "credit", "description", "type", "category"]
  for (const field of order) {
    let bestIndex = -1
    let bestScore = 0
    normalized.forEach((header, index) => {
      if (used.has(index)) return
      const score = matchesHint(header, HEADER_HINTS[field])
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })
    if (bestIndex !== -1) {
      mapping[field] = bestIndex
      used.add(bestIndex)
    }
  }
  return mapping
}

export function isMappingUsable(mapping: ColumnMapping): boolean {
  const hasAmount =
    mapping.amount !== undefined || mapping.debit !== undefined || mapping.credit !== undefined
  return mapping.date !== undefined && hasAmount
}

// Alguns bancos colocam dados da conta antes da tabela. Procura, nas primeiras
// linhas, a primeira que tenha cabeçalho de data e de valor.
export function findHeaderRow(rows: string[][], maxScan = 20): number {
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    if (isMappingUsable(detectColumns(rows[i]))) return i
  }
  return -1
}

// ---------- Linhas ----------

const INCOME_WORDS = ["receita", "income", "entrada", "credito", "credit", "c", "cr"]
const EXPENSE_WORDS = ["despesa", "expense", "saida", "debito", "debit", "d", "db"]

export function parseTypeCell(raw: string): TransactionType | null {
  const value = normalizeHeader(raw)
  if (INCOME_WORDS.includes(value)) return "income"
  if (EXPENSE_WORDS.includes(value)) return "expense"
  return null
}

export type RowIssue = { line: number; reason: string }

export type BuildResult = { rows: ImportRow[]; issues: RowIssue[] }

// `line` nos avisos é o número da linha no arquivo (começa em 1).
export function buildImportRows(
  table: string[][],
  headerIndex: number,
  mapping: ColumnMapping
): BuildResult {
  const rows: ImportRow[] = []
  const issues: RowIssue[] = []

  const cell = (row: string[], field: ColumnField): string =>
    mapping[field] === undefined ? "" : (row[mapping[field]!] ?? "")

  for (let i = headerIndex + 1; i < table.length; i++) {
    const row = table[i]
    const line = i + 1

    const date = parseDate(cell(row, "date"))
    if (!date) {
      issues.push({ line, reason: "Data inválida" })
      continue
    }

    let signed: number | null = null
    if (mapping.amount !== undefined) {
      signed = parseAmount(cell(row, "amount"))
    }
    if (signed === null && (mapping.debit !== undefined || mapping.credit !== undefined)) {
      const debit = parseAmount(cell(row, "debit"))
      const credit = parseAmount(cell(row, "credit"))
      if (debit !== null || credit !== null) {
        signed = Math.abs(credit ?? 0) - Math.abs(debit ?? 0)
      }
    }
    if (signed === null) {
      issues.push({ line, reason: "Valor inválido" })
      continue
    }
    if (signed === 0) {
      issues.push({ line, reason: "Valor zerado" })
      continue
    }

    // Coluna de tipo explícita ganha do sinal (formato do próprio Fin+).
    const explicit = mapping.type !== undefined ? parseTypeCell(cell(row, "type")) : null
    const type: TransactionType = explicit ?? (signed > 0 ? "income" : "expense")

    const description = cell(row, "description").replace(/\s+/g, " ").trim().slice(0, 200)

    const categoryName = cell(row, "category").replace(/\s+/g, " ").trim().slice(0, 60)

    rows.push({
      date,
      description: description || "Sem descrição",
      amount: Math.round(Math.abs(signed) * 100) / 100,
      type,
      ...(categoryName ? { categoryName } : {}),
    })
  }

  return { rows, issues }
}

// ---------- Janela de tempo ----------

// Mesmo dia, N meses atrás; se o mês não tem esse dia (31 de maio - 3 meses),
// usa o último dia do mês.
export function monthsAgo(today: Date, months: number): string {
  const year = today.getFullYear()
  const month = today.getMonth() - months
  const lastDay = new Date(year, month + 1, 0).getDate()
  return toDateString(new Date(year, month, Math.min(today.getDate(), lastDay), 12))
}

export const IMPORT_MONTHS = 3

export type WindowResult = { inside: ImportRow[]; before: number; future: number }

// Mantém só o que está entre N meses atrás e hoje. Conta o que ficou de fora
// para a prévia poder avisar.
export function filterImportWindow(
  rows: ImportRow[],
  today: Date = new Date(),
  months: number = IMPORT_MONTHS
): WindowResult {
  const start = monthsAgo(today, months)
  const end = toDateString(today)
  const inside: ImportRow[] = []
  let before = 0
  let future = 0
  for (const row of rows) {
    if (row.date < start) before++
    else if (row.date > end) future++
    else inside.push(row)
  }
  return { inside, before, future }
}

// ---------- Duplicadas ----------

type KeyFields = Pick<ImportRow, "date" | "type" | "amount" | "description">

export function duplicateKey(t: KeyFields): string {
  const description = normalizeHeader(t.description)
  return `${t.date}|${t.type}|${t.amount.toFixed(2)}|${description}`
}

// "exact": mesma data, tipo, valor e descrição (o servidor também recusa).
// "possible": mesmo tipo e valor, data a poucos dias e descrição parecida — só
// uma dica para a prévia; quem decide é a pessoa.
export type DuplicateKind = "exact" | "possible" | false

export const POSSIBLE_DUPLICATE_DAYS = 2

// Dias entre duas datas "YYYY-MM-DD". Usa UTC puro para não depender do fuso.
export function daysBetween(a: string, b: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split("-").map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round(Math.abs(toUtc(a) - toUtc(b)) / 86_400_000)
}

export function sameAmount(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100)
}

// "Padaria" (digitado à mão) vs "COMPRA PADARIA SAO JOAO, MADRID" (banco).
export function similarDescription(a: string, b: string): boolean {
  const na = normalizeHeader(a)
  const nb = normalizeHeader(b)
  if (na === "" || nb === "") return false
  if (na === nb || na.includes(nb) || nb.includes(na)) return true

  const wordsA = new Set(extractMerchantKey(a).split(" ").filter(Boolean))
  const wordsB = new Set(extractMerchantKey(b).split(" ").filter(Boolean))
  if (wordsA.size === 0 || wordsB.size === 0) return false
  let shared = 0
  for (const w of wordsA) if (wordsB.has(w)) shared++
  return shared / Math.min(wordsA.size, wordsB.size) >= 0.5
}

// Duas passadas sobre o que existe (cada transação do banco só "casa" uma vez):
// 1) idênticas; 2) com o que sobrou, as parecidas, escolhendo a data mais próxima.
// A ordem importa: se as parecidas viessem antes, uma poderia roubar o par de
// uma idêntica.
export function markDuplicates<T extends KeyFields>(
  rows: T[],
  existing: KeyFields[]
): (T & { duplicate: DuplicateKind })[] {
  const available = new Map<string, number>()
  for (const t of existing) {
    const key = duplicateKey(t)
    available.set(key, (available.get(key) ?? 0) + 1)
  }

  const kinds: DuplicateKind[] = rows.map(() => false)
  const unmatched: number[] = []
  rows.forEach((row, i) => {
    const key = duplicateKey(row)
    const left = available.get(key) ?? 0
    if (left > 0) {
      available.set(key, left - 1)
      kinds[i] = "exact"
    } else {
      unmatched.push(i)
    }
  })

  // O que sobrou do banco depois da passada 1, como lista para remover ao casar.
  const remaining: KeyFields[] = []
  for (const t of existing) {
    const key = duplicateKey(t)
    const left = available.get(key) ?? 0
    if (left > 0) {
      available.set(key, left - 1)
      remaining.push(t)
    }
  }

  for (const i of unmatched) {
    const row = rows[i]
    let best = -1
    let bestDays = Infinity
    remaining.forEach((t, j) => {
      if (t.type !== row.type || !sameAmount(t.amount, row.amount)) return
      const days = daysBetween(t.date, row.date)
      if (days > POSSIBLE_DUPLICATE_DAYS || days >= bestDays) return
      if (!similarDescription(t.description, row.description)) return
      best = j
      bestDays = days
    })
    if (best >= 0) {
      remaining.splice(best, 1)
      kinds[i] = "possible"
    }
  }

  return rows.map((row, i) => ({ ...row, duplicate: kinds[i] }))
}
