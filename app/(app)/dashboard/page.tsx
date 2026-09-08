import { SectionCards } from "@/components/dashboard/section-cards"
import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart-interactive"

export default async function Dashboard() {

interface CardData {
  label: string
  value: string
  trend: "up" | "down"
  trendLabel: string
  description: string
  comment?: string
}

const cardData: CardData[] = [
  {
    label: "Ganhos",
    value: " R$ 1500",
    trend: "up",
    trendLabel: "10%",
    description:  "+ R$ 200 em relação ao mês anterior",
    comment: "Ganhos do mês",
  },
  {
    label: "Despesas",
    value: " R$ 600",
    trend: "down",
    trendLabel: " 33%",
    description:  "- R$ 300 em relação ao mês anterior",
    comment: "despesas do mês",
  },
]

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