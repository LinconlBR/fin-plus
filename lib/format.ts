const locale = "pt-BR"
const defaultCurrency = "BRL"

// Formatters são criados uma vez só: instanciar Intl.NumberFormat é relativamente
// caro, e essas funções rodam uma vez por linha em listas e tabelas.
const defaultCurrencyFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: defaultCurrency,
})

const percentFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

// exceptZero decide o sinal DEPOIS de arredondar: 0,04 vira "0,0%" e não "+0,0%".
const percentChangeFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})

function toNumber(value: number | string): number {
  return typeof value === "string" ? parseFloat(value) : value
}

export function formatCurrency(
  value: number | string,
  currency: string = defaultCurrency
): string {
  const formatter =
    currency === defaultCurrency
      ? defaultCurrencyFormatter
      : new Intl.NumberFormat(locale, { style: "currency", currency })
  return formatter.format(toNumber(value))
}

// Recebe o valor já na escala 0-100 (49.9 vira "49,9%"), não uma fração.
export function formatPercent(value: number | string): string {
  return percentFormatter.format(toNumber(value)) + "%"
}

// Variação com sinal (+75,0% / -8,0%). null (sem período anterior) vira "—".
export function formatPercentChange(value: number | string | null): string {
  if (value === null) return "—"
  return percentChangeFormatter.format(toNumber(value)) + "%"
}


const pointsFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})

// Diferença entre duas porcentagens, em pontos percentuais.
// Ex.: taxa de poupança de 25% para 38% = "+13,0 p.p." (e não "+52%").
export function formatPercentPoints(value: number | null): string {
  if (value === null) return "—"
  return pointsFormatter.format(value) + " p.p."
}