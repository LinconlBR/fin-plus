"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_COLORS } from "@/components/categories/category-colors"
import { formatCurrency } from "@/lib/format"
import type { GoalTrendPoint } from "@/lib/reports"

type Goal = { id: string; name: string }

export function GoalsTrendChart({
  trend,
  goals,
  windowLabel,
}: {
  trend: GoalTrendPoint[]
  goals: Goal[]
  windowLabel: string
}) {
  // Achata point.values[goalId] em propriedades diretas do ponto — o
  // Recharts precisa que cada dataKey exista no nível raiz do objeto,
  // não aninhado dentro de "values".
  const data = trend.map((point) => ({
    label: point.label,
    ...point.values,
  }))

  // Um <Line> por meta, cor tirada da paleta fixa, ciclando se passar de 8.
  // O ChartConfig também é gerado dinamicamente: uma entrada por goal.id.
  const chartConfig = Object.fromEntries(
    goals.map((goal, index) => [
      goal.id,
      {
        label: goal.name,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      },
    ])
  ) satisfies ChartConfig

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Evolução das metas</CardTitle>
        <p className="text-sm text-muted-foreground">{windowLabel}</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={96}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span>{name}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {goals.map((goal, index) => (
              <Line
                key={goal.id}
                dataKey={goal.id}
                name={goal.name}
                type="monotone"
                stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}