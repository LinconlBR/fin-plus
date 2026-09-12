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
      comment: "Este é o saldo líquido após subtrair as despesas totais das receitas totais para o mês atual.",
    },
  ]
}

export default async function Dashboard() {

  // Cria o cliente(server) Supabase
const supabase = await createClient()

// Obtém a data atual e calcula o primeiro e último dia do mês (para os cards) 
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

// Obtém a data atual e calcula a data de 90 dias atrás( para o gráfico) 
const ninetyDaysAgo = new Date()
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)


  //------------ Busca as transações do mês atual no Supabase (para os cards) --------------
  const { data: transactions } = await supabase
  .from("transactions")
  .select("*")
    /*.toISOString() transforma o objeto Date num texto completo, tipo "2026-09-08T00:00:00.000Z"
      .split("T") quebra esse texto em duas partes, usando a letra "T" como ponto de corte — vira um array: ["2026-09-08", "00:00:00.000Z"]
      [0] pega só o primeiro pedaço do array — a data pura, sem hora: "2026-09-08"*/
  .gte("date", startOfMonth.toISOString().split("T")[0])
  .lte("date", endOfMonth.toISOString().split("T")[0])

  // Calcula o total de receitas, despesas e saldo
  const totalIncome = transactions?.filter((t) => t.type === "income").reduce((acc, transaction) => {
      return acc + Number(transaction.amount)
  }, 0) ?? 0

  // Calcula o total de despesas
  const totalExpenses = transactions?.filter((t) => t.type === "expense").reduce((acc, transaction) => {
      return acc + Number(transaction.amount)
  }, 0) ?? 0
  
  // Calcula o saldo
  const balance = totalIncome - totalExpenses

  // Gera os dados dos cards
  const cardData = generateCardData(totalIncome, totalExpenses, balance)
  //------------ Fim da busca das transações do mês atual no Supabase (para os cards) --------------


  // -------- Busca as transações dos últimos 90 dias no Supabase (para o gráfico)
  const { data: transactions90Days } = await supabase
  .from("transactions")
  .select("*")
  .gte("date", ninetyDaysAgo.toISOString().split("T")[0])
  
  // Agrupa as transações por dia para o gráfico
  const grouped: Record<string, { income: number; expense: number }> = {}
  for (const t of transactions90Days ?? []) {
    const day = t.date // já vem como "AAAA-MM-DD"
    // Se ainda não existe um registro para esse dia, inicializa com 0
    if (!grouped[day]) {
      grouped[day] = { income: 0, expense: 0 }
    }
    // Adiciona o valor da transação ao total do dia, dependendo do tipo
    if (t.type === "income") {
      grouped[day].income += Number(t.amount)
    } else {
      grouped[day].expense += Number(t.amount)
    }
  }
  // Converte o objeto agrupado em um array de pontos para o gráfico
  const chartPoints = Object.entries(grouped).map(([date, values]) => ({
    date,
    income: values.income,
    expense: values.expense,
  }))


  return (
    <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards  cards={cardData}  />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={chartPoints} /> 
              </div>
            </div>
          </div>
      </div>
  )
}