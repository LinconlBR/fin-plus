import { describe, expect, it } from "vitest"
import {
  buildHistoryIndex,
  createSuggester,
  selectRulesToLearn,
  type CategoryRef,
  type LearnableRow,
} from "@/lib/categorize"

const cat = (id: string, name: string, type: "income" | "expense"): CategoryRef => ({ id, name, type })
const categories = [
  cat("alim", "Alimentação", "expense"),
  cat("transp", "Transporte", "expense"),
  cat("lazer", "Lazer", "expense"),
  cat("outras", "Outros gastos", "expense"),
  cat("sal", "Salário", "income"),
]
const ids = new Set(categories.map((c) => c.id))

const suggester = (over: { rules?: never[]; history?: Map<string, string> } & Record<string, unknown> = {}) =>
  createSuggester({ categories, rules: [], history: new Map(), ...over } as never)

describe("createSuggester — dicionário", () => {
  it("sugere pela palavra do estabelecimento, casando com o nome da categoria", () => {
    const s = suggester()
    expect(s("PAGO MOVIL EN MERCADONA SAN D, MADRID ES", "expense")).toEqual({ category_id: "alim", source: "dictionary" })
    expect(s("PAGO MOVIL EN METRO DE MADRID, MADRID ES", "expense")?.category_id).toBe("transp")
    expect(s("TRANSFERENCIA DE EMPRESA, CONCEPTO NOMINA", "income")?.category_id).toBe("sal")
  })
  it("não sugere se a pessoa não tem categoria compatível", () => {
    const s = createSuggester({ categories: [cat("outras", "Outros gastos", "expense")], rules: [], history: new Map() })
    expect(s("PAGO MOVIL EN MERCADONA", "expense")).toBeNull()
  })
  it("respeita o tipo (nomina como despesa não sugere Salário)", () => {
    expect(suggester()("NOMINA", "expense")).toBeNull()
  })
  it("casa palavra inteira, não pedaço", () => {
    expect(suggester()("DIAGNOSTICO XYZ", "expense")).toBeNull()
  })
  it("não sugere para desconhecidos", () => {
    expect(suggester()("PAGO MOVIL EN YOHE BARBER", "expense")).toBeNull()
  })
})

describe("createSuggester — regras e histórico", () => {
  it("regra aprendida vence histórico e dicionário", () => {
    const s = createSuggester({
      categories,
      rules: [{ merchant_key: "mercadona san", type: "expense", category_id: "lazer" }],
      history: new Map([["expense|mercadona san", "transp"]]),
    })
    expect(s("PAGO MOVIL EN MERCADONA SAN D, MADRID", "expense")).toEqual({ category_id: "lazer", source: "rule" })
  })
  it("histórico vence dicionário", () => {
    const s = createSuggester({ categories, rules: [], history: new Map([["expense|mercadona san", "lazer"]]) })
    expect(s("PAGO MOVIL EN MERCADONA SAN D, MADRID", "expense")).toEqual({ category_id: "lazer", source: "history" })
  })
  it("ignora regra e histórico de categoria que não existe mais", () => {
    const s = createSuggester({
      categories,
      rules: [{ merchant_key: "yohe barber", type: "expense", category_id: "apagada" }],
      history: new Map([["expense|yohe barber", "apagada"]]),
    })
    expect(s("PAGO MOVIL EN YOHE BARBER, MADRID", "expense")).toBeNull()
  })
  it("a regra é por tipo: receita e despesa do mesmo nome não se misturam", () => {
    const s = createSuggester({
      categories,
      rules: [{ merchant_key: "bizum eusebio", type: "expense", category_id: "outras" }],
      history: new Map(),
    })
    expect(s("BIZUM A FAVOR DE EUSEBIO GONZALEZ", "expense")?.category_id).toBe("outras")
    expect(s("BIZUM DE EUSEBIO GONZALEZ", "income")).toBeNull()
  })
})

describe("buildHistoryIndex", () => {
  it("escolhe a categoria mais usada por estabelecimento", () => {
    const t = (category_id: string) => ({ description: "PAGO MOVIL EN YOHE BARBER, MADRID", type: "expense" as const, category_id })
    const index = buildHistoryIndex([t("lazer"), t("alim"), t("alim")], ids)
    expect(index.get("expense|yohe barber")).toBe("alim")
  })
  it("ignora transações sem categoria válida ou sem estabelecimento", () => {
    const index = buildHistoryIndex(
      [
        { description: "Mercado", type: "expense", category_id: "" },
        { description: "Mercado", type: "expense", category_id: "apagada" },
        { description: "1234", type: "expense", category_id: "alim" },
      ],
      ids
    )
    expect(index.size).toBe(0)
  })
})

describe("selectRulesToLearn", () => {
  const row = (over: Partial<LearnableRow> = {}): LearnableRow => ({
    description: "PAGO MOVIL EN YOHE BARBER, MADRID",
    type: "expense",
    category_id: "lazer",
    include: true,
    source: null,
    touched: false,
    ...over,
  })
  it("aprende o que a pessoa escolheu à mão", () => {
    expect(selectRulesToLearn([row({ touched: true })])).toEqual([
      { merchant_key: "yohe barber", type: "expense", category_id: "lazer" },
    ])
  })
  it("não aprende a categoria-padrão de linhas sem sugestão que ninguém mexeu", () => {
    expect(selectRulesToLearn([row()])).toEqual([])
  })
  it("confirma sugestões de histórico e dicionário, mas não repete regras", () => {
    expect(selectRulesToLearn([row({ source: "dictionary" })])).toHaveLength(1)
    expect(selectRulesToLearn([row({ source: "history" })])).toHaveLength(1)
    expect(selectRulesToLearn([row({ source: "rule" })])).toEqual([])
  })
  it("confirma a categoria que veio no próprio arquivo", () => {
    expect(selectRulesToLearn([row({ source: "file" })])).toHaveLength(1)
  })
  it("ignora linhas não importadas, sem categoria ou sem estabelecimento", () => {
    expect(selectRulesToLearn([row({ touched: true, include: false })])).toEqual([])
    expect(selectRulesToLearn([row({ touched: true, category_id: "" })])).toEqual([])
    expect(selectRulesToLearn([row({ touched: true, description: "1234" })])).toEqual([])
  })
  it("a última escolha para o mesmo estabelecimento vence", () => {
    const result = selectRulesToLearn([row({ touched: true, category_id: "lazer" }), row({ touched: true, category_id: "alim" })])
    expect(result).toEqual([{ merchant_key: "yohe barber", type: "expense", category_id: "alim" }])
  })
})
