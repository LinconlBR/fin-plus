import { MonthNavigator } from "@/components/month-navigator"
import { YearNavigator } from "@/components/year-navigator"
import type { ReportPeriod } from "@/lib/reports"

// Escolhe o navegador pelo modo do toggle: no Mês anda de mês em mês,
// no Ano anda de ano em ano. Os dois leem e escrevem o mesmo ?month=.
export function PeriodNavigator({
  period,
  month,
  minMonth,
  maxMonth,
}: {
  period: ReportPeriod
  month: string
  minMonth: string
  maxMonth: string
}) {
  return (
    <div className="flex justify-end">
      {period === "year" ? (
        <YearNavigator currentMonth={month} minMonth={minMonth} maxMonth={maxMonth} />
      ) : (
        <MonthNavigator currentMonth={month} minMonth={minMonth} maxMonth={maxMonth} />
      )}
    </div>
  )
}