// Lê o TEXTO de um extrato em PDF (já extraído) sem IA, quando o layout é o
// comum: cada movimento começa numa linha com a data e termina com o valor e,
// às vezes, o saldo. Se o layout não for reconhecido com segurança, devolve
// confident=false e quem chamou decide (ex.: cair na leitura com IA).

import { parseAmount, parseDate, type ImportRow, type RowIssue } from "@/lib/transaction-import"

export type StatementParse = {
  rows: ImportRow[]
  issues: RowIssue[]
  // false = não confie: poucas linhas lidas ou sinais dos valores ambíguos.
  confident: boolean
}

const DATE_AT_START =
  /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(?:de\s+)?[A-Za-zÀ-ÿ]{3,10}\.?\s+(?:de\s+)?\d{4})(?=\s|$)/

// Valor monetário no formato europeu/brasileiro (1.234,56) ou americano
// (1,234.56), com sinal e moeda opcionais. Exige duas casas decimais para não
// confundir com números de loja ou de cartão.
const MONEY =
  /[-+−]?\s?(?:R\$|€|\$|EUR|BRL|USD)?\s?\d{1,3}(?:[.\s]\d{3})*,\d{2}\s?(?:€|EUR|BRL|R\$)?|[-+−]?\s?(?:R\$|€|\$)?\s?\d{1,3}(?:,\d{3})*\.\d{2}\s?(?:€|EUR|USD|\$)?/g

const VALUE_DATE_LINE = /^(f\.?\s*valor|fecha\s+valor|data\s+valor|value\s+date)\b/i
const PAGE_LINE = /^(p[aá]gina|page|pág\.?)\s+\d+(\s+(de|of)\s+\d+)?$/i
const HEADER_LINE = /\b(fecha|data|date)\b.*\b(importe|valor|amount|monto|montante)\b/i

// O cabeçalho da tabela diz se existe coluna de saldo (último valor da linha).
function hasBalanceColumn(lines: string[]): boolean {
  return lines.some((l) => HEADER_LINE.test(l) && /\b(saldo|balance)\b/i.test(l))
}

function cleanDescription(text: string): string {
  return text.replace(/\s+/g, " ").replace(/[\s,;:-]+$/, "").trim()
}

type Record = { dateText: string; body: string[] }

// Coluna "Tipo" explícita (formato exportado pelo Fin+): sem sinal nos valores,
// a palavra logo antes do valor diz se é receita ou despesa.
const TYPE_WORD_BEFORE_AMOUNT = /(?:^|\s)(receita|despesa|ingreso|gasto|income|expense)\s*$/i

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export type StatementOptions = {
  // Nomes de categoria da pessoa: permitem separar "descrição" de "categoria"
  // quando o PDF traz as duas coladas (ex.: "supermercado Alimentação Despesa").
  categoryNames?: string[]
}

export function parseStatementText(text: string, options: StatementOptions = {}): StatementParse {
  const categoryNames = [...(options.categoryNames ?? [])].sort((a, b) => b.length - a.length)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "")

  const balanceColumn = hasBalanceColumn(lines)

  // 1. Divide em registros: cada um começa numa linha que abre com uma data.
  const records: Record[] = []
  let current: Record | null = null
  for (const line of lines) {
    if (PAGE_LINE.test(line) || HEADER_LINE.test(line)) {
      // Cabeçalho repetido a cada página não pertence ao movimento anterior.
      current = null
      continue
    }
    if (VALUE_DATE_LINE.test(line)) continue

    const start = DATE_AT_START.exec(line)
    if (start && parseDate(start[1])) {
      current = { dateText: start[1], body: [line.slice(start[0].length).trim()] }
      records.push(current)
    } else if (current) {
      current.body.push(line)
    }
  }

  const rows: ImportRow[] = []
  const issues: RowIssue[] = []
  let negatives = 0
  let explicitTypes = 0

  records.forEach((record, index) => {
    const date = parseDate(record.dateText)
    const body = record.body.filter((b) => b !== "").join(" ")
    const tokens = [...body.matchAll(MONEY)]
    const need = balanceColumn ? 2 : 1

    // Os últimos valores da linha são o movimento (e o saldo); valores antes
    // deles, como "Comision 0,00", fazem parte da descrição.
    if (!date || tokens.length < need) {
      issues.push({ line: index + 1, reason: !date ? "Data inválida" : "Valor não encontrado" })
      return
    }
    const amountToken = tokens[tokens.length - need]
    const amount = parseAmount(amountToken[0])
    if (amount === null || amount === 0) {
      issues.push({ line: index + 1, reason: "Valor inválido" })
      return
    }
    if (/^[-−]/.test(amountToken[0].trim()) || amount < 0) negatives++

    let before = body.slice(0, amountToken.index)
    const explicit = TYPE_WORD_BEFORE_AMOUNT.exec(before)
    let type: ImportRow["type"] =
      amount < 0 || /^[-−]/.test(amountToken[0].trim()) ? "expense" : "income"
    let categoryName: string | undefined

    if (explicit) {
      explicitTypes++
      const word = normalizeText(explicit[1])
      type = word === "despesa" || word === "gasto" || word === "expense" ? "expense" : "income"
      before = before.slice(0, explicit.index)

      // O que vem colado antes da palavra pode ser a categoria.
      const normalizedBefore = normalizeText(before.trim())
      const match = categoryNames.find((name) => {
        const n = normalizeText(name)
        return normalizedBefore === n || normalizedBefore.endsWith(" " + n)
      })
      if (match) {
        categoryName = match
        const trimmed = before.trim()
        before = trimmed.slice(0, trimmed.length - match.length)
      }
    }

    const description = cleanDescription(before)
    rows.push({
      date,
      description: description || "Sem descrição",
      amount: Math.round(Math.abs(amount) * 100) / 100,
      type,
      ...(categoryName ? { categoryName } : {}),
    })
  })

  // Segurança: a maioria dos registros precisa ter sido lida, e, com vários
  // movimentos, algum precisa ter sinal negativo. Sem isso as despesas podem
  // estar sem sinal (colunas de débito/crédito) e seriam lidas como receitas.
  const readRatio = records.length === 0 ? 0 : rows.length / records.length
  const signsLookRight = rows.length < 3 || negatives > 0 || explicitTypes === rows.length
  const confident = rows.length > 0 && readRatio >= 0.9 && signsLookRight

  return { rows, issues, confident }
}
