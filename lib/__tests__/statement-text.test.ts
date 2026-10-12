import { describe, expect, it } from "vitest"
import { parseStatementText } from "@/lib/statement-text"

// Mesma estrutura do texto extraído do PDF do Santander (Espanha). Dados fictícios.
const SANTANDER = `Titular: Nome Ficticio
Cuenta: ES00 0000 0000 0000 0000 0000
Saldo disponible: 854,97€ (a fecha 12 oct 2026)
Documento a fecha: 12 oct 2026 Página 1 de 2
Movimientos de tu cuenta
Para búsquedas genéricas solo se presentan por defecto los últimos 40 movimientos
Fecha operación Operación Importe Saldo
11 oct 2026
F. valor: 11 oct 2026
Pago Movil En Dia 9419, Madrid Es, Tarj. :*000000 -1,97€ 950,97€
11 oct 2026
F. valor: 11 oct 2026
Bizum A Favor De Fulano De Tal Concepto: Prestimo -1,97€ 952,94€
07 oct 2026
F. valor: 05 oct 2026
Compra Lycamobile, Alcobendas, Tarjeta 0000000000000000 ,
Comision 0,00
-5,00€ 959,99€
07 oct 2026
F. valor: 07 oct 2026
Bizum A Favor De Ciclano Concepto:
Prestimo
-400,00€ 992,29€
06 oct 2026
F. valor: 06 oct 2026
Transferencia De Empresa, S.L., Concepto Nomina. 1.302,71€ 1.394,26€
Página 1 de 2
Fecha operación Operación Importe Saldo
05 oct 2026
F. valor: 05 oct 2026
Pago Movil En Mercadona San D, Madrid Es, Tarj. :*000000 -21,61€ 91,55€`

describe("parseStatementText — estrutura do Santander", () => {
  const result = parseStatementText(SANTANDER)

  it("lê todos os movimentos e é confiável", () => {
    expect(result.confident).toBe(true)
    expect(result.issues).toEqual([])
    expect(result.rows).toHaveLength(6)
  })
  it("lê data, tipo e valor, incluindo milhar e o sinal", () => {
    expect(result.rows.map((r) => [r.date, r.type, r.amount])).toEqual([
      ["2026-10-11", "expense", 1.97],
      ["2026-10-11", "expense", 1.97],
      ["2026-10-07", "expense", 5],
      ["2026-10-07", "expense", 400],
      ["2026-10-06", "income", 1302.71],
      ["2026-10-05", "expense", 21.61],
    ])
  })
  it("usa a data da operação, não a 'F. valor'", () => {
    expect(result.rows[2].date).toBe("2026-10-07")
  })
  it("monta a descrição sem o valor, juntando linhas quebradas e mantendo 'Comision 0,00'", () => {
    expect(result.rows[0].description).toBe("Pago Movil En Dia 9419, Madrid Es, Tarj. :*000000")
    expect(result.rows[2].description).toBe("Compra Lycamobile, Alcobendas, Tarjeta 0000000000000000 , Comision 0,00")
    expect(result.rows[3].description).toBe("Bizum A Favor De Ciclano Concepto: Prestimo")
  })
  it("ignora cabeçalho, rodapé de página e dados da conta", () => {
    expect(result.rows.some((r) => /titular|cuenta|p[aá]gina|fecha operaci/i.test(r.description))).toBe(false)
  })
})

describe("parseStatementText — outros formatos", () => {
  it("lê datas dd/mm/aaaa e valores brasileiros sem coluna de saldo", () => {
    const text = `Extrato
Data Descrição Valor
10/10/2026 Pix recebido João 1.500,00
09/10/2026 Compra Mercado Extra -230,45
08/10/2026 Uber *Trip -18,90`
    const result = parseStatementText(text)
    expect(result.confident).toBe(true)
    expect(result.rows.map((r) => [r.date, r.type, r.amount])).toEqual([
      ["2026-10-10", "income", 1500],
      ["2026-10-09", "expense", 230.45],
      ["2026-10-08", "expense", 18.9],
    ])
    expect(result.rows[1].description).toBe("Compra Mercado Extra")
  })
  it("com R$ no valor", () => {
    const result = parseStatementText("Data Descrição Valor\n10/10/2026 Padaria -R$ 12,50")
    expect(result.rows[0]).toMatchObject({ type: "expense", amount: 12.5 })
  })
  it("desconfia quando nenhum valor tem sinal (débito e crédito sem sinal)", () => {
    const text = `Data Descrição Valor
10/10/2026 Compra A 10,00
09/10/2026 Compra B 20,00
08/10/2026 Compra C 30,00`
    const result = parseStatementText(text)
    expect(result.rows).toHaveLength(3)
    expect(result.confident).toBe(false)
  })
  it("desconfia quando poucos registros são lidos", () => {
    const text = `10/10/2026 sem valor aqui
09/10/2026 outro sem valor
08/10/2026 Compra -10,00`
    const result = parseStatementText(text)
    expect(result.confident).toBe(false)
    expect(result.issues).toHaveLength(2)
  })
  it("texto sem datas não é confiável e não quebra", () => {
    expect(parseStatementText("Olá mundo\nsem extrato")).toEqual({ rows: [], issues: [], confident: false })
    expect(parseStatementText("")).toEqual({ rows: [], issues: [], confident: false })
  })
  it("ignora linhas de valor-data soltas", () => {
    const text = "Data Descrição Valor Saldo\n10/10/2026 Teste -5,00 100,00\nData valor: 10/10/2026"
    expect(parseStatementText(text).rows).toHaveLength(1)
  })
})

// Formato do PDF exportado pelo próprio Fin+: valores sem sinal e coluna Tipo.
describe("parseStatementText — PDF exportado pelo Fin+", () => {
  const FIN = `Fin+ — Transações
Período: 01/09/2026 a 12/10/2026
Receitas: R$ 1.450,00 Despesas: R$ 1.056,75 Saldo: R$ 393,25
Data Descrição Categoria Tipo Valor
12/10/2026 blusa da nike Roupas Despesa R$ 22,00
12/10/2026 supermercado Alimentação Despesa R$ 50,00
30/09/2026 Salario Salário Receita R$ 100,00
05/09/2026 Salario Salário Receita R$ 1.300,00
18/09/2026 Outro gasto Outros gastos Despesa R$ 9,90
Página 1`
  const categoryNames = ["Roupas", "Alimentação", "Salário", "Outros gastos"]

  it("usa a coluna Tipo e é confiável mesmo sem sinal nos valores", () => {
    const result = parseStatementText(FIN, { categoryNames })
    expect(result.confident).toBe(true)
    expect(result.rows.map((r) => [r.type, r.amount])).toEqual([
      ["expense", 22], ["expense", 50], ["income", 100], ["income", 1300], ["expense", 9.9],
    ])
  })
  it("separa descrição e categoria quando conhece as categorias", () => {
    const result = parseStatementText(FIN, { categoryNames })
    expect(result.rows[0]).toMatchObject({ description: "blusa da nike", categoryName: "Roupas" })
    expect(result.rows[1]).toMatchObject({ description: "supermercado", categoryName: "Alimentação" })
    expect(result.rows[4]).toMatchObject({ description: "Outro gasto", categoryName: "Outros gastos" })
  })
  it("sem a lista de categorias, ainda lê tipo e valor (categoria fica na descrição)", () => {
    const result = parseStatementText(FIN)
    expect(result.confident).toBe(true)
    expect(result.rows[0].type).toBe("expense")
    expect(result.rows[0].categoryName).toBeUndefined()
  })
  it("não confunde o resumo de receitas/despesas do topo com movimentos", () => {
    expect(parseStatementText(FIN, { categoryNames }).rows).toHaveLength(5)
  })
})
