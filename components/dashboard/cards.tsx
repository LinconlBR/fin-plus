import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
  balance: number
): CardData[] {
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
      trendLabel: "+12% em relação ao mês anterior",
    },
    {
      label: "Despesas do Mês",
      value: totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <ArrowDownLeft className="size-4 text-expense" />,
      dotColor: "bg-expense",
      iconBg: "bg-expense/15",
      borderColor: "border-expense/60 shadow-glow-primary",
      trendLabel: "-8% em relação ao mês anterior",
    },
  ]
}

export async function DashboardCards() {
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

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .lte("date", endOfMonth.toISOString().split("T")[0])

  const totalIncome =
    transactions
      ?.filter((t) => t.type === "income")
      .reduce((acc, t) => acc + Number(t.amount), 0) ?? 0

  const totalExpenses =
    transactions
      ?.filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount), 0) ?? 0

  const balance = totalIncome - totalExpenses
  const cards = generateCardData(totalIncome, totalExpenses, balance)

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
          <Card
            key={card.label}
            className={cn("border", card.borderColor)}
          >
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