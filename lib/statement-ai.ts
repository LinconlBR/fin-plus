// Leitura de extrato com IA, usada só quando as regras de lib/statement-text.ts
// não reconhecem o layout. Tudo aqui é puro: o texto é limpo de dados pessoais
// ANTES de sair do servidor, e a resposta da IA nunca é confiada: cada linha
// passa por validação rígida.

import { z } from "zod"
import { parseDate, type ImportRow } from "@/lib/transaction-import"

// Teto do texto enviado à IA (cada chamada gasta cota paga).
export const MAX_STATEMENT_CHARS = 24_000

// Remove o que identifica a pessoa e não ajuda a ler os movimentos.
export function redactStatementText(text: string): string {
  return (
    text
      .split(/\r?\n/)
      // Linhas de titular, conta, IBAN, endereço, e-mail e telefone do cabeçalho.
      .filter((line) => !/^\s*(titular|titulares|cuenta|conta|account|iban|nombre|nome|name|cliente|dni|nif|cpf|cnpj|direcci[oó]n|endere[cç]o|address|email|e-mail|tel[eé]fono|telefone|phone)\b/i.test(line))
      .join("\n")
      // IBAN (ES47 0049 1555 ...), possivelmente com espaços.
      .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/g, "[conta]")
      // Sequências longas de dígitos (cartão, conta, documento), com ou sem espaços.
      .replace(/\b\d(?:[ -]?\d){8,}\b/g, "[número]")
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
  )
}

export function buildStatementPrompt(text: string): string {
  return `Você extrai movimentos de um extrato bancário. Abaixo está o texto do extrato. Responda SOMENTE com um array JSON, sem explicações e sem markdown. Cada item: {"date":"AAAA-MM-DD","description":"texto curto do movimento","amount":-12.34}. Regras: "amount" é número com ponto decimal; NEGATIVO para saídas (compras, pagamentos, transferências enviadas) e POSITIVO para entradas (salário, transferências recebidas). Use a data da operação. Ignore saldos, totais, cabeçalhos, rodapés e qualquer linha que não seja um movimento. Se não houver movimentos, responda [].\n\nTexto do extrato:\n${text}`
}

const aiRowSchema = z.object({
  date: z.string(),
  description: z.string().transform((d) => d.replace(/\s+/g, " ").trim().slice(0, 200)),
  amount: z.number().finite(),
})

// A IA às vezes embrulha o JSON em ```json ... ``` ou escreve uma frase antes.
export function extractJsonArray(raw: string): unknown {
  const start = raw.indexOf("[")
  const end = raw.lastIndexOf("]")
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

export type AiParseResult = { rows: ImportRow[]; dropped: number }

// Converte a resposta da IA em linhas de importação, descartando as inválidas.
export function parseAiStatement(raw: string): AiParseResult {
  const json = extractJsonArray(raw)
  if (!Array.isArray(json)) return { rows: [], dropped: 0 }

  const rows: ImportRow[] = []
  let dropped = 0
  for (const item of json) {
    const parsed = aiRowSchema.safeParse(item)
    const date = parsed.success ? parseDate(parsed.data.date) : null
    if (!parsed.success || !date || parsed.data.amount === 0) {
      dropped++
      continue
    }
    rows.push({
      date,
      description: parsed.data.description || "Sem descrição",
      amount: Math.round(Math.abs(parsed.data.amount) * 100) / 100,
      type: parsed.data.amount < 0 ? "expense" : "income",
    })
  }
  return { rows, dropped }
}
