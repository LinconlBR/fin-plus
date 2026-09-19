import { createClient } from "@/lib/supabase/server"
import { ChartAreaInteractive } from "@/components/dashboard/chart/chart-interactive"

export async function DashboardChart() {
  const supabase = await createClient()

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: transactionsBefore } = await supabase
    .from("transactions")
    .select("*")
    .lt("date", ninetyDaysAgo.toISOString().split("T")[0])

  const saldoInicial = (transactionsBefore ?? []).reduce((acc, t) => {
    return t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)

  const { data: transactions90Days } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", ninetyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true })

  const grouped: Record<string, { net: number; expense: number }> = {}
  for (const t of transactions90Days ?? []) {
    const day = t.date
    if (!grouped[day]) grouped[day] = { net: 0, expense: 0 }
    if (t.type === "income") {
      grouped[day].net += Number(t.amount)
    } else {
      grouped[day].expense += Number(t.amount)
      grouped[day].net -= Number(t.amount)
    }
  }

  let saldoAcumulado = saldoInicial
  const chartPoints = Object.entries(grouped).map(([date, values]) => {
    saldoAcumulado += values.net
    return { date, currentBalance: saldoAcumulado, expense: values.expense }
  })

  return <ChartAreaInteractive data={chartPoints} />
}