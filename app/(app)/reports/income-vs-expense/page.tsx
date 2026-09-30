import { parsePeriod } from "@/lib/reports"
import { IncomeVsExpensesContent } from "@/components/reports/income-vs-expense/income-vs-expense-content"

export default async function IncomeVsExpensesPage(
  props: PageProps<"/reports/income-vs-expense">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  return <IncomeVsExpensesContent period={parsedPeriod} />
}