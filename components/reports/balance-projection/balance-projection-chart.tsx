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
import { formatCurrency } from "@/lib/format"
import type { ProjectionPoint } from "@/lib/reports"

const chartConfig = {
  actual: { label: "Realizado", color: "var(--income)" },
  projected: { label: "Projeção", color: "var(--primary)" },
} satisfies ChartConfig

export function BalanceProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
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
        {/* Linha cheia: só tem valor nos meses já realizados (nulo dali pra
            frente, o que faz o Recharts parar de desenhar sozinho, sem
            precisar de nenhuma configuração extra). */}
        <Line
          dataKey="actual"
          name="Realizado"
          type="monotone"
          stroke="var(--color-actual)"
          strokeWidth={2}
          dot={false}
        />
        {/* Linha tracejada: nula nos meses passados, EXCETO no último mês
            realizado, que recebe o mesmo valor da linha cheia — é esse
            ponto compartilhado que faz as duas linhas se encontrarem sem
            buraco no meio do gráfico. */}
        <Line
          dataKey="projected"
          name="Projeção"
          type="monotone"
          stroke="var(--color-projected)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}