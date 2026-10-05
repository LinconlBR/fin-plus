import { resolveReportPeriod } from "@/lib/report-period"
import { PeriodNavigator } from "@/components/reports/period-navigator"
import { ReportCategoriesContent } from "@/components/reports/categories/categories-content"

export default async function CategoriesPage(props: PageProps<"/reports/categories">) {
  const { period, month, minMonth, maxMonth } = await resolveReportPeriod(props.searchParams)

  return (
    <>
      <PeriodNavigator period={period} month={month} minMonth={minMonth} maxMonth={maxMonth} />
      <ReportCategoriesContent period={period} month={month} />
    </>
  )
}