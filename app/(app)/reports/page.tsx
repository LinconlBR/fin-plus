import { parsePeriod } from "@/lib/reports"
import { OverviewContent } from "@/components/reports/overview/overview-content"

export default async function ReportsPage(props: PageProps<"/reports">) {
  const { period } = await props.searchParams

  return <OverviewContent period={parsePeriod(period)} />
}