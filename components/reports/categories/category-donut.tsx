"use client"

import { Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format"

type DonutItem = {
  id: string
  name: string
  color: string
  total: number
}

// As cores vêm dos próprios dados (cada categoria tem a sua), então o config
// só precisa existir — o ChartContainer exige a prop.
const chartConfig = {
  total: { label: "Total" },
} satisfies ChartConfig

export function CategoryDonut({
  items,
  total,
}: {
  items: DonutItem[]
  total: number
}) {
  // O Pie lê a cor de cada fatia do campo `fill` do dado.
  const data = items.map((item) => ({ ...item, fill: item.color }))

  return (
    <div className="relative mx-auto size-56">
      <ChartContainer config={chartConfig} className="aspect-square size-full">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.payload?.fill }}
                      />
                      {name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius={60}
            strokeWidth={2}
          />
        </PieChart>
      </ChartContainer>

      {/* Total no centro. pointer-events-none deixa o tooltip do gráfico funcionar por baixo. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}