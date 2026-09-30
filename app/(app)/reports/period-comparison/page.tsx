import { parsePeriod } from "@/lib/reports"
import { PeriodComparisonContent } from "@/components/reports/period-comparison/period-comparison-content"

export default async function PeriodComparisonPage(
  props: PageProps<"/reports/period-comparison">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  return <PeriodComparisonContent period={parsedPeriod} />
}