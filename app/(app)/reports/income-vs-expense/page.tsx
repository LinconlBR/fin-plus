import { resolveReportPeriod } from "@/lib/report-period"
import { PeriodNavigator } from "@/components/reports/period-navigator"
import { IncomeVsExpensesContent } from "@/components/reports/income-vs-expense/income-vs-expense-content"

export default async function IncomeVsExpensesPage(props: PageProps<"/reports/income-vs-expense">) {
  const { period, month, minMonth, maxMonth } = await resolveReportPeriod(props.searchParams)

  return (
    <>
      <PeriodNavigator period={period} month={month} minMonth={minMonth} maxMonth={maxMonth} />
      <IncomeVsExpensesContent period={period} month={month} />
    </>
  )
}