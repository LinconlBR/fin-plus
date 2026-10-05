import { resolveReportPeriod } from "@/lib/report-period"
import { PeriodNavigator } from "@/components/reports/period-navigator"
import { PeriodComparisonContent } from "@/components/reports/period-comparison/period-comparison-content"

export default async function PeriodComparisonPage(props: PageProps<"/reports/period-comparison">) {
  const { period, month, minMonth, maxMonth } = await resolveReportPeriod(props.searchParams)

  return (
    <>
      <PeriodNavigator period={period} month={month} minMonth={minMonth} maxMonth={maxMonth} />
      <PeriodComparisonContent period={period} month={month} />
    </>
  )
}