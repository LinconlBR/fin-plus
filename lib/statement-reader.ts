// Orquestra a leitura de um extrato em PDF a partir do texto já extraído:
// 1) regras (grátis, determinístico); 2) IA, só se as regras não reconhecerem
// o layout. A IA entra por parâmetro para o fluxo ser testável sem rede.

import {
  buildStatementPrompt,
  MAX_STATEMENT_CHARS,
  parseAiStatement,
  redactStatementText,
} from "@/lib/statement-ai"
import { parseStatementText } from "@/lib/statement-text"
import type { ImportRow } from "@/lib/transaction-import"

export const MAX_STATEMENT_ROWS = 2000

export type StatementReadResult =
  | { ok: true; rows: ImportRow[]; method: "rules" | "ai"; notices: string[] }
  | { ok: false; error: string }

export type AskAi = (prompt: string, maxLength: number) => Promise<string>

export async function readStatement(
  text: string,
  options: { categoryNames: string[]; askAi: AskAi }
): Promise<StatementReadResult> {
  const byRules = parseStatementText(text, { categoryNames: options.categoryNames })
  const notices: string[] = []

  if (byRules.confident) {
    if (byRules.issues.length > 0) {
      notices.push(`${byRules.issues.length} linhas do PDF não puderam ser lidas.`)
    }
    return { ok: true, rows: byRules.rows.slice(0, MAX_STATEMENT_ROWS), method: "rules", notices }
  }

  // Layout desconhecido: limpa dados pessoais e pergunta à IA.
  const redacted = redactStatementText(text)
  if (redacted.length > MAX_STATEMENT_CHARS) {
    notices.push("O extrato é longo: só o início foi lido. Importe em partes, por período.")
  }

  const answer = await options.askAi(buildStatementPrompt(redacted.slice(0, MAX_STATEMENT_CHARS)), MAX_STATEMENT_CHARS + 2000)
  if (answer.trim() === "") {
    return {
      ok: false,
      error: "Não consegui ler este PDF. Tente o CSV ou o XLSX do seu banco, ou tente de novo em alguns minutos.",
    }
  }

  const { rows, dropped } = parseAiStatement(answer)
  if (rows.length === 0) {
    return { ok: false, error: "Não encontrei movimentos neste PDF. Tente o CSV ou o XLSX do seu banco." }
  }
  if (dropped > 0) notices.push(`${dropped} itens lidos pela IA foram descartados por estarem incompletos.`)
  notices.push("Este PDF foi lido com IA: confira datas, valores e sinais antes de importar.")

  return { ok: true, rows: rows.slice(0, MAX_STATEMENT_ROWS), method: "ai", notices }
}
