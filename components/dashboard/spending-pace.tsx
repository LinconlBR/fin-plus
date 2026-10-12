import { Gauge } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatPercentChange } from "@/lib/format"
import { getSpendingPace } from "@/lib/dashboard-widgets"
import { changeTone, changeToneClass, filterByDate, getPeriodRangeStrings, getPreviousPeriodRangeStrings, monthToDate } from "@/lib/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export async function DashboardSpendingPace({ month }: { month: string }) {
  const supabase = await createClient()

  const reference = monthToDate(month)
  const current = getPeriodRangeStrings("month", reference)
  const previous = getPreviousPeriodRangeStrings("month", reference)

  // Uma consulta cobre o mês anterior inteiro e o mês visto.
  const { data } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "expense")
    .gte("date", previous.start)
    .lte("date", current.end)
    .throwOnError()

  const rows = data ?? []
  const sum = (items: typeof rows) => items.reduce((total, row) => total + Number(row.amount), 0)

  const pace = getSpendingPace({
    spent: sum(filterByDate(rows, current)),
    previousSpent: sum(filterByDate(rows, previous)),
    month,
    today: new Date(),
  })

  const hasSpending = pace.dailyAverage > 0 || pace.projected > 0
  const tone = changeTone(pace.change, false) // gastar menos é melhor

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <Gauge className="size-4 text-accent-violet" />
        <CardTitle>Ritmo de gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSpending ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Média por dia</p>
              <p className="text-2xl font-bold">{formatCurrency(pace.dailyAverage)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {pace.isComplete ? "Total gasto no mês" : "Projeção para o fim do mês"}
              </p>
              <p className="text-xl font-semibold">{formatCurrency(pace.projected)}</p>
              {pace.change !== null && (
                <p className={`text-xs ${changeToneClass[tone]}`}>
                  {formatPercentChange(pace.change)} em relação ao mês anterior
                </p>
              )}
            </div>
            {!pace.reliable && (
              <p className="text-xs text-muted-foreground">
                Poucos dias de dados: a projeção ainda varia bastante.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
