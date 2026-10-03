import { DashboardCards } from "@/components/dashboard/cards"
import { DashboardChart } from "@/components/dashboard/chart/chart"
import { DashboardLastTransactions } from "@/components/dashboard/last-transactions"
import { DashboardInsights } from "@/components/dashboard/insights"
import { MonthNavigator } from "@/components/month-navigator"
import { toDateString, getWeekRangeStrings } from "@/lib/reports"

export default async function Dashboard(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams

  const month =
    typeof searchParams.month === "string"
      ? searchParams.month
      : toDateString(new Date()).slice(0, 7)

  const chartRange = searchParams.chartRange === "week" ? "week" : "month"

  const week =
    typeof searchParams.week === "string"
      ? searchParams.week
      : getWeekRangeStrings(new Date()).start

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <MonthNavigator currentMonth={month} />
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