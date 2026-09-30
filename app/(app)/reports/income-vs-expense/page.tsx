import { parsePeriod } from "@/lib/reports"
import { IncomeVsExpensesContent } from "@/components/reports/income-vs-expenses/income-vs-expenses-content"

export default async function IncomeVsExpensesPage(
  props: PageProps<"/reports/income-vs-expenses">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  return <IncomeVsExpensesContent period={parsedPeriod} />
}