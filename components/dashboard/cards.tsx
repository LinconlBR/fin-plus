import { TrendingDown, TrendingUp } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CardData {
  label: string
  value: string
  trend: "up" | "down"
  trendLabel: string
  description: string
  comment?: string
}

function generateCardData(
  totalIncome: number,
  totalExpenses: number,
  balance: number
): CardData[] {
  return [
    {
      label: "Receitas",
      value: totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      trend: "up",
      trendLabel: "",
      description: "receitas totais para o mês atual",
      comment: "Estas são as receitas totais para o mês atual.",
    },
    {
      label: "Despesas",
      value: totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      trend: "down",
      trendLabel: "",
      description: "despesas totais para o mês atual",
      comment: "Estas são as despesas totais para o mês atual.",
    },
    {
      label: "Saldo",
      value: balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      trend: balance >= 0 ? "up" : "down",
      trendLabel: "",
      description: "saldo líquido para o mês atual",
      comment:
        "Este é o saldo líquido após subtrair as despesas totais das receitas totais para o mês atual.",
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

      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 sm:grid-cols-3 dark:*:data-[slot=card]:bg-card">
        {cards.map((card) => (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {card.trend === "up" ? (
                    <span className="--color-success">
                      <TrendingUp className="text-success" />
                    </span>
                  ) : (
                    <span className="text-destructive">
                      <TrendingDown />
                    </span>
                  )}
                  {card.trendLabel}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.description}
              </div>
              <div className="text-muted-foreground">
                {card.comment ? card.comment : "Sem comentários"}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}