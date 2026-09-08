import { SectionCards } from "@/components/dashboard/section-cards"
import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart-interactive"

interface CardData {
  label: string
  value: string
  trend: "up" | "down"
  trendLabel: string
  description: string
  comment?: string
}

function generateCardData(totalIncome: number, totalExpenses: number, balance: number): CardData[] {
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
      description: " saldo líquido para o mês atual",
      comment: "Esté é o saldo líquido após subtrair as despesas totais das receitas totais para o mês atual.",
    },
  ]
}

export default async function Dashboard() {

const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

const supabase = await createClient()

const { data: transactions } = await supabase
  .from("transactions")
  .select("*")
    /*.toISOString() transforma o objeto Date num texto completo, tipo "2026-09-08T00:00:00.000Z"
      .split("T") quebra esse texto em duas partes, usando a letra "T" como ponto de corte — vira um array: ["2026-09-08", "00:00:00.000Z"]
      [0] pega só o primeiro pedaço do array — a data pura, sem hora: "2026-09-08"*/
  .gte("date", startOfMonth.toISOString().split("T")[0])
  .lte("date", endOfMonth.toISOString().split("T")[0])

  const totalIncome = transactions?.filter((t) => t.type === "income").reduce((acc, transaction) => {
      return acc + Number(transaction.amount)
  }, 0) ?? 0

  const totalExpenses = transactions?.filter((t) => t.type === "expense").reduce((acc, transaction) => {
      return acc + Number(transaction.amount)
  }, 0) ?? 0

  const balance = totalIncome - totalExpenses  

  const cardData = generateCardData(totalIncome, totalExpenses, balance)

  return (
    <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards  cards={cardData}  />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive /> 
              </div>
            </div>
          </div>
      </div>
  )
}