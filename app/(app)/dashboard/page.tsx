import { DashboardCards } from "@/components/dashboard/cards"
import { DashboardChart } from "@/components/dashboard/chart/chart"
import { DashboardLastTransactions } from "@/components/dashboard/last-transactions"
import { DashboardInsights } from "@/components/dashboard/insights"

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header 
      <div className="flex items-center justify-between border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
      </div>
      */}
      <div className="space-y-6 p-6 md:p-8">
        <div>
          <DashboardCards />
        </div>
        <DashboardInsights />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardChart />
          </div>
          <DashboardLastTransactions />
        </div>

        
      </div>
    </main>
  )
}