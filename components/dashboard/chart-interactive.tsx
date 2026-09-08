"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useState } from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Este gráfico interativo mostra a evolução das receitas e despesas ao longo do tempo. Você pode selecionar diferentes intervalos de tempo para visualizar os dados correspondentes. As áreas coloridas representam as receitas (em verde) e as despesas (em vermelho), permitindo uma comparação visual clara entre os dois fluxos financeiros."
/*
const chartData = [
  { date: "2024-04-01", income: 222, expense: 150 },
  { date: "2024-04-02", income: 97, expense: 180 },
  { date: "2024-04-03", income: 167, expense: 120 },
  { date: "2024-04-04", income: 242, expense: 260 },
  { date: "2024-04-05", income: 373, expense: 290 },
  { date: "2024-04-06", income: 301, expense: 340 },
  { date: "2024-04-07", income: 245, expense: 180 },
  { date: "2024-04-08", income: 409, expense: 320 },
  { date: "2024-04-09", income: 59, expense: 110 },
  { date: "2024-04-10", income: 261, expense: 190 },
  { date: "2024-04-11", income: 327, expense: 350 },
  { date: "2024-04-12", income: 292, expense: 210 },
  { date: "2024-04-13", income: 342, expense: 380 },
  { date: "2024-04-14", income: 137, expense: 220 },
  { date: "2024-04-15", income: 120, expense: 170 },
  { date: "2024-04-16", income: 138, expense: 190 },
  { date: "2024-04-17", income: 446, expense: 360 },
  { date: "2024-04-18", income: 364, expense: 410 },
  { date: "2024-04-19", income: 243, expense: 180 },
  { date: "2024-04-20", income: 89, expense: 150 },
  { date: "2024-04-21", income: 137, expense: 200 },
  { date: "2024-04-22", income: 224, expense: 170 },
  { date: "2024-04-23", income: 138, expense: 230 },
  { date: "2024-04-24", income: 387, expense: 290 },
  { date: "2024-04-25", income: 215, expense: 250 },
  { date: "2024-04-26", income: 75, expense: 130 },
  { date: "2024-04-27", income: 383, expense: 420 },
  { date: "2024-04-28", income: 122, expense: 180 },
  { date: "2024-04-29", income: 315, expense: 240 },
  { date: "2024-04-30", income: 454, expense: 380 },
  { date: "2024-05-01", income: 165, expense: 220 },
  { date: "2024-05-02", income: 293, expense: 310 },
  { date: "2024-05-03", income: 247, expense: 190 },
  { date: "2024-05-04", income: 385, expense: 420 },
  { date: "2024-05-05", income: 481, expense: 390 },
  { date: "2024-05-06", income: 498, expense: 520 },
  { date: "2024-05-07", income: 388, expense: 300 },
  { date: "2024-05-08", income: 149, expense: 210 },
  { date: "2024-05-09", income: 227, expense: 180 },
  { date: "2024-05-10", income: 293, expense: 330 },
  { date: "2024-05-11", income: 335, expense: 270 },
  { date: "2024-05-12", income: 197, expense: 240 },
  { date: "2024-05-13", income: 197, expense: 160 },
  { date: "2024-05-14", income: 448, expense: 490 },
  { date: "2024-05-15", income: 473, expense: 380 },
  { date: "2024-05-16", income: 338, expense: 400 },
  { date: "2024-05-17", income: 499, expense: 420 },
  { date: "2024-05-18", income: 315, expense: 350 },
  { date: "2024-05-19", income: 235, expense: 180 },
  { date: "2024-05-20", income: 177, expense: 230 },
  { date: "2024-05-21", income: 82, expense: 140 },
  { date: "2024-05-22", income: 81, expense: 120 },
  { date: "2024-05-23", income: 252, expense: 290 },
  { date: "2024-05-24", income: 294, expense: 220 },
  { date: "2024-05-25", income: 201, expense: 250 },
  { date: "2024-05-26", income: 213, expense: 170 },
  { date: "2024-05-27", income: 420, expense: 460 },
  { date: "2024-05-28", income: 233, expense: 190 },
  { date: "2024-05-29", income: 78, expense: 130 },
  { date: "2024-05-30", income: 340, expense: 280 },
  { date: "2024-05-31", income: 178, expense: 230 },
  { date: "2024-06-01", income: 178, expense: 200 },
  { date: "2024-06-02", income: 470, expense: 410 },
  { date: "2024-06-03", income: 103, expense: 160 },
  { date: "2024-06-04", income: 439, expense: 380 },
  { date: "2024-06-05", income: 88, expense: 140 },
  { date: "2024-06-06", income: 294, expense: 250 },
  { date: "2024-06-07", income: 323, expense: 370 },
  { date: "2024-06-08", income: 385, expense: 320 },
  { date: "2024-06-09", income: 438, expense: 480 },
  { date: "2024-06-10", income: 155, expense: 200 },
  { date: "2024-06-11", income: 92, expense: 150 },
  { date: "2024-06-12", income: 492, expense: 420 },
  { date: "2024-06-13", income: 81, expense: 130 },
  { date: "2024-06-14", income: 426, expense: 380 },
  { date: "2024-06-15", income: 307, expense: 350 },
  { date: "2024-06-16", income: 371, expense: 310 },
  { date: "2024-06-17", income: 475, expense: 520 },
  { date: "2024-06-18", income: 107, expense: 170 },
  { date: "2024-06-19", income: 341, expense: 290 },
  { date: "2024-06-20", income: 408, expense: 450 },
  { date: "2024-06-21", income: 169, expense: 210 },
  { date: "2024-06-22", income: 317, expense: 270 },
  { date: "2024-06-23", income: 480, expense: 530 },
  { date: "2024-06-24", income: 132, expense: 180 },
  { date: "2024-06-25", income: 141, expense: 190 },
  { date: "2024-06-26", income: 434, expense: 380 },
  { date: "2024-06-27", income: 448, expense: 490 },
  { date: "2024-06-28", income: 149, expense: 200 },
  { date: "2024-06-29", income: 103, expense: 160 },
  { date: "2024-06-30", income: 446, expense: 400 },
]
  */

const chartConfig = {
  income: {
    label: "Receitas",
    color: "var(--color-chart-3)",
  },
  expense: {
    label: "Despesas",
    color: "var(--color-chart-5)",
  },
} satisfies ChartConfig


type ChartPoint = {
  date: string
  income: number
  expense: number
}

export function ChartAreaInteractive({ data }: { data: ChartPoint[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState(isMobile ? "7d" : "90d")

  const filteredData = data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Receitas vs Despesas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {timeRange === "90d" && "Total dos últimos 3 meses"}
            {timeRange === "30d" && "Total dos últimos 30 dias"}
            {timeRange === "7d" && "Total dos últimos 7 dias"}
          </span>


          <span className="@[540px]/card:hidden">Últimos 3 meses</span>
        </CardDescription>
        <CardAction>
            {/**/}
          <ToggleGroup
            value={[timeRange]}
            onValueChange={(value) => {
              if (value && value.length > 0) setTimeRange(value[0])
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
            
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value ?? "90d")}
          >
            <SelectTrigger

              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
             // className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="expense"
              type="natural"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              stackId="a"
            />
            <Area
              dataKey="income"
              type="natural"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
