import { createClient } from "@/lib/supabase/server"
import { CategoryIcon } from "@/components/categories/category-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPeriodRangeStrings } from "@/lib/reports"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export async function DashboardLastTransactions({ month }: { month: string }) {
  const supabase = await createClient()

  const [year, m] = month.split("-").map(Number)
  const range = getPeriodRangeStrings("month", new Date(year, m - 1, 1))

  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color)")
    .gte("date", range.start)
    .lte("date", range.end)
    .order("date", { ascending: false })
    .limit(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas transações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransactions?.length ? (
          recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CategoryIcon
                  icon={t.categories?.icon ?? "Tag"}
                  color={t.categories?.color ?? "#94a3b8"}
                />
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.categories?.name ?? "Sem categoria"} •{" "}
                    {dateFormatter.format(new Date(t.date))}
                  </p>
                </div>
              </div>
              <span
                className={
                  t.type === "income"
                    ? "text-sm font-medium text-income"
                    : "text-sm font-medium text-expense"
                }
              >
                {t.type === "income" ? "+" : "-"}
                {currencyFormatter.format(Number(t.amount))}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma transação neste mês.</p>
        )}
      </CardContent>
    </Card>
  )
}