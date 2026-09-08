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