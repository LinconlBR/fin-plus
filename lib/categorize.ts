// Sugere a categoria de uma transação importada. Ordem de confiança:
//   1. regra aprendida das correções da própria pessoa (category_rules)
//   2. histórico: categoria mais usada para o mesmo estabelecimento
//   3. dicionário de estabelecimentos comuns
// Lógica pura: o que vem do banco entra por parâmetro.

import { CATEGORY_DICTIONARY } from "@/lib/category-dictionary"
import { extractMerchantKey } from "@/lib/merchant"
import type { TransactionType } from "@/lib/transaction-import"

export type CategoryRef = { id: string; name: string; type: TransactionType }
export type CategoryRule = { merchant_key: string; type: TransactionType; category_id: string }
export type HistoryTransaction = { description: string; type: TransactionType; category_id: string }

export type SuggestionSource = "rule" | "history" | "dictionary"
export type Suggestion = { category_id: string; source: SuggestionSource }

const ruleId = (key: string, type: TransactionType) => `${type}|${key}`

function normalizeName(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

// Para cada (tipo, estabelecimento), a categoria mais usada nas transações já salvas.
export function buildHistoryIndex(
  history: HistoryTransaction[],
  validCategoryIds: Set<string>
): Map<string, string> {
  const counts = new Map<string, Map<string, number>>()
  for (const t of history) {
    if (!t.category_id || !validCategoryIds.has(t.category_id)) continue
    const key = extractMerchantKey(t.description)
    if (!key) continue
    const id = ruleId(key, t.type)
    const byCategory = counts.get(id) ?? new Map<string, number>()
    byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + 1)
    counts.set(id, byCategory)
  }

  const index = new Map<string, string>()
  for (const [id, byCategory] of counts) {
    let best: string | null = null
    let bestCount = 0
    for (const [categoryId, count] of byCategory) {
      if (count > bestCount) {
        best = categoryId
        bestCount = count
      }
    }
    if (best) index.set(id, best)
  }
  return index
}

// Procura, nas palavras da descrição, uma entrada do dicionário e resolve para
// uma categoria que a pessoa realmente tenha.
function suggestFromDictionary(
  description: string,
  type: TransactionType,
  categories: CategoryRef[]
): string | null {
  const words = new Set(
    normalizeName(description)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  )
  const owned = categories.filter((c) => c.type === type)

  for (const entry of CATEGORY_DICTIONARY) {
    if (entry.type !== type) continue
    if (!entry.keywords.some((k) => words.has(k))) continue
    for (const wanted of entry.categoryNames) {
      const match = owned.find((c) => normalizeName(c.name) === wanted)
      if (match) return match.id
    }
  }
  return null
}

export type SuggestionContext = {
  categories: CategoryRef[]
  rules: CategoryRule[]
  history: Map<string, string>
}

export function createSuggester(context: SuggestionContext) {
  const valid = new Set(context.categories.map((c) => c.id))
  const rules = new Map(
    context.rules
      // Regra cuja categoria foi apagada ou mudou de tipo não vale mais.
      .filter((r) => valid.has(r.category_id))
      .map((r) => [ruleId(r.merchant_key, r.type), r.category_id])
  )

  return (description: string, type: TransactionType): Suggestion | null => {
    const key = extractMerchantKey(description)

    if (key) {
      const id = ruleId(key, type)
      const rule = rules.get(id)
      if (rule) return { category_id: rule, source: "rule" }
      const past = context.history.get(id)
      if (past && valid.has(past)) return { category_id: past, source: "history" }
    }

    const fromDictionary = suggestFromDictionary(description, type, context.categories)
    return fromDictionary ? { category_id: fromDictionary, source: "dictionary" } : null
  }
}

// ---------- Aprendizado ----------

export type LearnableRow = {
  description: string
  type: TransactionType
  category_id: string
  include: boolean
  // De onde veio a categoria no momento da prévia (null = nenhuma sugestão).
  source: SuggestionSource | null
  // A pessoa mudou a categoria desta linha à mão.
  touched: boolean
}

// Decide o que vira regra. Linhas sem sugestão e que a pessoa não mexeu NÃO
// entram: senão a categoria-padrão de "não sei" viraria uma regra errada.
export function selectRulesToLearn(rows: LearnableRow[]): CategoryRule[] {
  const rules = new Map<string, CategoryRule>()
  for (const row of rows) {
    if (!row.include || !row.category_id) continue
    if (!row.touched && row.source === null) continue
    if (!row.touched && row.source === "rule") continue // já é regra

    const key = extractMerchantKey(row.description)
    if (!key) continue
    // A última escolha da pessoa para o mesmo estabelecimento vence.
    rules.set(ruleId(key, row.type), { merchant_key: key, type: row.type, category_id: row.category_id })
  }
  return [...rules.values()]
}
