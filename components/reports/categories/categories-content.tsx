import {
  changeTone,
  changeToneClass,
  getComparableRanges,
  groupExpensesByCategory,
  monthToDate,
  percentChange,
  type ExpenseRow,
  type ReportPeriod,
} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"
import { CategoryDonut } from "@/components/reports/categories/category-donut"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercentChange, formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

// Cabeçalho e linhas usam o mesmo grid, senão as colunas desalinham.
const rankingGrid = "grid grid-cols-[130px_1fr_110px_130px] items-center gap-4"

export async function ReportCategoriesContent({
  period,
  month,
}: {
  period: ReportPeriod
  month: string
}) {
  // O período vem do mês navegado (no modo Ano, o ano desse mês), não de "hoje".
  const referenceDate = monthToDate(month)
  // Período em andamento compara do início até hoje com o mesmo trecho do anterior.
  const {
    current: currentPeriod,
    previous: previousPeriod,
    partial,
  } = getComparableRanges(period, referenceDate)
  const supabase = await createClient()

  const [current, previous] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, category_id, categories(name, color)")
      .eq("type", "expense")
      .gte("date", currentPeriod.start)
      .lte("date", currentPeriod.end)
      .throwOnError(),
    supabase
      .from("transactions")
      .select("amount, category_id, categories(name, color)")
      .eq("type", "expense")
      .gte("date", previousPeriod.start)
      .lte("date", previousPeriod.end)
      .throwOnError(),
  ])

  const currentGroups = groupExpensesByCategory(
    (current.data ?? []) as unknown as ExpenseRow[]
  )
  const previousGroups = groupExpensesByCategory(
    (previous.data ?? []) as unknown as ExpenseRow[]
  )

  const categories = currentGroups.items.map((item) => {
    const previousItem = previousGroups.items.find((p) => p.id === item.id)
    const change = percentChange(item.total, previousItem?.total ?? 0)

    return { ...item, change }
  })

  if (currentGroups.total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Sem despesas neste período</p>
        <p className="text-sm text-muted-foreground">
          Registre transações para ver a distribuição por categoria.
        </p>
      </div>
    )
  }

  // O cabeçalho é estreito: no período em andamento a legenda curta basta.
  const comparisonLabel = partial
    ? "vs mesmo período"
    : period === "year"
      ? "vs ano anterior"
      : "vs mês anterior"

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="lg:w-96">
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonut items={currentGroups.items} total={currentGroups.total} />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Ranking de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              rankingGrid,
              "pb-2 text-xs whitespace-nowrap text-muted-foreground"
            )}
          >
            <span>Categoria</span>
            <span>Participação</span>
            <span className="text-right">Valor</span>
            <span className="text-right">{comparisonLabel}</span>
          </div>

          {categories.map((item) => (
            <div key={item.id} className={cn(rankingGrid, "border-t py-3")}>
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>

              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              <span className="text-right text-sm font-medium whitespace-nowrap tabular-nums">
                {formatCurrency(item.total)}
              </span>

              <span
                className={cn(
                  "text-right text-sm whitespace-nowrap",
                  changeToneClass[changeTone(item.change, false)]
                )}
              >
                {formatPercentChange(item.change)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}