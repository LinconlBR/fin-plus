import { resolveReportPeriod } from "@/lib/report-period"
import { PeriodNavigator } from "@/components/reports/period-navigator"
import { OverviewContent } from "@/components/reports/overview/overview-content"

export default async function ReportsPage(props: PageProps<"/reports">) {
  const { period, month, minMonth, maxMonth } = await resolveReportPeriod(props.searchParams)

  return (
    <>
      <PeriodNavigator period={period} month={month} minMonth={minMonth} maxMonth={maxMonth} />
      <OverviewContent period={period} month={month} />
    </>
  )
}