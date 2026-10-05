import { DashboardCards } from "@/components/dashboard/cards"
import { DashboardChart } from "@/components/dashboard/chart/chart"
import { DashboardLastTransactions } from "@/components/dashboard/last-transactions"
import { DashboardInsights } from "@/components/dashboard/insights"
import { MonthNavigator } from "@/components/month-navigator"
import { createClient } from "@/lib/supabase/server"
import {
  clampMonth,
  clampWeekToMonth,
  getMonthBounds,
  getWeekRangeStrings,
  parseMonth,
  parseWeek,
} from "@/lib/reports"

export default async function Dashboard(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const today = new Date()

  // Mês da primeira transação: é o limite de quanto dá pra voltar.
  const { data: firstTransaction } = await supabase
    .from("transactions")
    .select("date")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle()

  const { minMonth, maxMonth } = getMonthBounds(firstTransaction?.date, today)

  // O que vem da URL é validado e depois "preso" nos limites: digitar
  // ?month=2030-01 à mão cai no mês atual, não num mês futuro.
  const month = clampMonth(parseMonth(searchParams.month) ?? maxMonth, minMonth, maxMonth)

  const chartRange = searchParams.chartRange === "week" ? "week" : "month"

  // A semana também é presa ao mês exibido (e nunca passa da semana de hoje).
  const week = clampWeekToMonth(
    parseWeek(searchParams.week) ?? getWeekRangeStrings(today).start,
    month,
    today
  )

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <MonthNavigator currentMonth={month} minMonth={minMonth} maxMonth={maxMonth} />
      </div>

      <div className="space-y-6 p-6 md:p-8">
        <div>
          <DashboardCards month={month} />
        </div>
        <DashboardInsights />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardChart month={month} week={week} chartRange={chartRange} />
          </div>
          <DashboardLastTransactions month={month} />
        </div>
      </div>
    </main>
  )
}