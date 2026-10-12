import { ChartPie } from "lucide-react"
import { getMonthAnalysis } from "@/lib/overview"
import { formatCurrency, formatPercent } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TOP = 5

export async function DashboardTopCategories({ month }: { month: string }) {
  const { categories } = await getMonthAnalysis(month)

  const total = categories.reduce((sum, c) => sum + c.total, 0)
  const top = categories.slice(0, TOP)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <ChartPie className="size-4 text-accent-violet" />
        <CardTitle>Top categorias de gasto</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
        ) : (
          <ul className="space-y-4">
            {top.map((category) => {
              const percentage = total === 0 ? 0 : (category.total / total) * 100
              return (
                <li key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(category.total)} · {formatPercent(percentage)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: category.color }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
