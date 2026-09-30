import { parsePeriod } from "@/lib/reports"
import { BalanceProjectionContent } from "@/components/reports/balance-projection/balance-projection-content"

export default async function BalanceProjectionPage(
  props: PageProps<"/reports/balance-projection">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  if (!parsedPeriod) {
    return <div>Invalid period</div>
  }

  return <BalanceProjectionContent period={parsedPeriod} />
}