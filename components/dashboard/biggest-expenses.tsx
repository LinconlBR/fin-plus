import { TrendingDown } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { CategoryIcon } from "@/components/categories/category-icons"
import { formatCurrency, formatDayMonth } from "@/lib/format"
import { getPeriodRangeStrings, monthToDate } from "@/lib/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export async function DashboardBiggestExpenses({ month }: { month: string }) {
  const supabase = await createClient()
  const range = getPeriodRangeStrings("month", monthToDate(month))

  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color)")
    .eq("type", "expense")
    .gte("date", range.start)
    .lte("date", range.end)
    .order("amount", { ascending: false })
    .limit(5)
    .throwOnError()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingDown className="size-4 text-accent-violet" />
        <CardTitle>Maiores despesas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.length ? (
          data.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CategoryIcon
                  icon={expense.categories?.icon ?? "Tag"}
                  color={expense.categories?.color ?? "#94a3b8"}
                />
                <div>
                  <p className="text-sm font-medium">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.categories?.name ?? "Sem categoria"} • {formatDayMonth(expense.date)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-expense">
                -{formatCurrency(expense.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
        )}
      </CardContent>
    </Card>
  )
}
