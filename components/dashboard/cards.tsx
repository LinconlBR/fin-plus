import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  getPeriodRangeStrings,
  getPreviousPeriodRangeStrings,
  percentChange,
  toDateString,
} from "@/lib/reports"

interface CardData {
  label: string
  value: string
  icon: React.ReactNode
  dotColor: string
  iconBg: string
  borderColor?: string
  trendLabel?: string
}

function generateCardData(
  totalIncome: number,
  totalExpenses: number,
  balance: number,
  incomeTrend: number | null,
  expenseTrend: number | null
): CardData[] {
  const formatTrend = (trend: number | null, label: string) => {
    if (trend === null) return `Sem dados do ${label} anterior`
    const sign = trend >= 0 ? "+" : ""
    return `${sign}${trend.toFixed(0)}% em relação ao ${label} anterior`
  }

  return [
    {
      label: "Saldo Atual",
      value: balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <Wallet className="size-4 text-accent-violet" />,
      dotColor: "bg-accent-violet",
      iconBg: "bg-accent-violet/15",
    },
    {
      label: "Receitas do Mês",
      value: totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <ArrowUpRight className="size-4 text-income" />,
      dotColor: "bg-income",
      iconBg: "bg-income/15",
      borderColor: "border-income/60 shadow-glow-secondary",
      trendLabel: formatTrend(incomeTrend, "mês"),
    },
    {
      label: "Despesas do Mês",
      value: totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <ArrowDownLeft className="size-4 text-expense" />,
      dotColor: "bg-expense",
      iconBg: "bg-expense/15",
      borderColor: "border-expense/60 shadow-glow-primary",
      trendLabel: formatTrend(expenseTrend, "mês"),
    },
  ]
}

export async function DashboardCards({ month }: { month?: string }) {
  
  const resolvedMonth = month ?? toDateString(new Date()).slice(0, 7)
  // ...troca todo uso de `month` por `resolvedMonth` daqui pra baixo
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single()

  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const [year, m] = resolvedMonth.split("-").map(Number)
  const referenceDate = new Date(year, m - 1, 1)
  const currentRange = getPeriodRangeStrings("month", referenceDate)
  const previousRange = getPreviousPeriodRangeStrings("month", referenceDate)

  // Busca em paralelo: as transações DO mês navegado, as do mês anterior
  // (só pra comparação de tendência), e TUDO antes do início do mês
  // navegado (pra reconstruir o saldo acumulado até ali).
  const [currentResult, previousResult, beforeResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", currentRange.start)
      .lte("date", currentRange.end)
      .throwOnError(),
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", previousRange.start)
      .lte("date", previousRange.end)
      .throwOnError(),
    supabase
      .from("transactions")
      .select("amount, type")
      .lt("date", currentRange.start)
      .throwOnError(),
  ])

  const sumByType = (rows: { amount: number | string; type: string }[] | null, type: string) =>
    (rows ?? [])
      .filter((t) => t.type === type)
      .reduce((acc, t) => acc + Number(t.amount), 0)

  const totalIncome = sumByType(currentResult.data, "income")
  const totalExpenses = sumByType(currentResult.data, "expense")

  const previousIncome = sumByType(previousResult.data, "income")
  const previousExpenses = sumByType(previousResult.data, "expense")

  // Saldo acumulado até o FIM do mês navegado: tudo antes do mês, mais o
  // líquido do próprio mês — não é só "receita menos despesa do mês".
  const balanceBeforeMonth = (beforeResult.data ?? []).reduce(
    (acc, t) => (t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)),
    0
  )
  const balance = balanceBeforeMonth + totalIncome - totalExpenses

  const incomeTrend = percentChange(totalIncome, previousIncome)
  const expenseTrend = percentChange(totalExpenses, previousExpenses)

  const cards = generateCardData(totalIncome, totalExpenses, balance, incomeTrend, expenseTrend)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          Olá{firstName ? `, ${firstName}` : ""}! 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Aqui está seu resumo financeiro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className={cn("border", card.borderColor)}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardDescription className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", card.dotColor)} />
                  {card.label}
                </CardDescription>
                <CardTitle className="mt-1 text-2xl font-semibold tabular-nums">
                  {card.value}
                </CardTitle>
              </div>
              <div className={cn("flex size-8 items-center justify-center rounded-md", card.iconBg)}>
                {card.icon}
              </div>
            </CardHeader>
            {card.trendLabel && (
              <div className="px-6 pb-4 text-xs text-muted-foreground">
                {card.trendLabel}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}