import { buildOverviewSummaryText, getOverviewInsight } from "@/lib/reports"
import { getMonthOverviewInput } from "@/lib/overview"
import { DashboardTips } from "@/components/dashboard/insight-tips"

export async function DashboardInsights({ month }: { month: string }) {
  const input = await getMonthOverviewInput(month)

  return (
    <DashboardTips
      month={month}
      summary={buildOverviewSummaryText(input)}
      fallback={getOverviewInsight(input)}
    />
  )
}
