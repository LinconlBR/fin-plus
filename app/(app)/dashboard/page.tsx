import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import { DashboardCards } from "@/components/dashboard/cards"
import { DashboardChart } from "@/components/dashboard/chart/chart"
import { DashboardLastTransactions } from "@/components/dashboard/last-transactions"
import { DashboardInsights } from "@/components/dashboard/insights"
import { DashboardTopCategories } from "@/components/dashboard/top-categories"
import { DashboardSpendingPace } from "@/components/dashboard/spending-pace"
import { DashboardBiggestExpenses } from "@/components/dashboard/biggest-expenses"
import { DashboardBudgetsAtRisk } from "@/components/dashboard/budgets-at-risk"
import { DashboardGoalsProgress } from "@/components/dashboard/goals-progress"
import { MonthNavigator } from "@/components/month-navigator"
import { buttonVariants } from "@/components/ui/button"
import { WIDGET_SIZE, buildDashboardRows, type WidgetId } from "@/lib/dashboard-layout"
import { getDashboardLayout } from "@/lib/preferences"
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

  const rows = buildDashboardRows(await getDashboardLayout())

  // Cada bloco do Dashboard, pelo id que o usuário escolhe em Personalizar.
  const widgets: Record<WidgetId, React.ReactNode> = {
    cards: <DashboardCards month={month} />,
    insights: <DashboardInsights month={month} />,
    chart: <DashboardChart month={month} week={week} chartRange={chartRange} />,
    transactions: <DashboardLastTransactions month={month} />,
    "top-categories": <DashboardTopCategories month={month} />,
    "spending-pace": <DashboardSpendingPace month={month} />,
    "biggest-expenses": <DashboardBiggestExpenses month={month} />,
    "budgets-at-risk": <DashboardBudgetsAtRisk month={month} />,
    "goals-progress": <DashboardGoalsProgress />,
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/customize/dashboard"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <SlidersHorizontal className="size-4" />
            Personalizar
          </Link>
          <MonthNavigator currentMonth={month} minMonth={minMonth} maxMonth={maxMonth} />
        </div>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">Todos os blocos do Dashboard estão ocultos</p>
            <Link
              href="/customize/dashboard"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Personalizar Dashboard
            </Link>
          </div>
        ) : (
          rows.map((row) =>
            row.length === 1 ? (
              <div key={row[0]}>{widgets[row[0]]}</div>
            ) : (
              // Dois blocos dividem a linha: gráfico (2/3) + transações (1/3), ou dois blocos
              // pequenos (1/2 cada). Em telas estreitas empilham.
              <div
                key={row.join("+")}
                className={
                  row.every((id) => WIDGET_SIZE[id] === "half")
                    ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
                    : "grid grid-cols-1 gap-6 lg:grid-cols-3"
                }
              >
                {row.map((id) => (
                  <div key={id} className={WIDGET_SIZE[id] === "wide" ? "lg:col-span-2" : undefined}>
                    {widgets[id]}
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </main>
  )
}
