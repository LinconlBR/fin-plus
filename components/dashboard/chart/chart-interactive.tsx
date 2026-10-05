"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { WeekNavigator } from "@/components/week-navigator"

const chartConfig = {
  currentBalance: { label: "Saldo", color: "var(--accent-cyan)" },
  expense: { label: "Despesas", color: "var(--primary)" },
} satisfies ChartConfig

type ChartPoint = {
  date: string
  currentBalance: number
  expense: number
}

export function ChartAreaInteractive({
  data,
  chartRange,
  month,
  week,
  minWeek,
  maxWeek,
}: {
  data: ChartPoint[]
  chartRange: "month" | "week"
  month: string
  week: string
  minWeek: string
  maxWeek: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildRangeHref = (range: "month" | "week") => {
    const params = new URLSearchParams(searchParams)
    params.set("chartRange", range)
    return `${pathname}?${params.toString()}`
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Saldo x Despesas</CardTitle>
        <CardDescription>
          {chartRange === "month" ? "Total do mês" : "Total da semana"}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <ToggleGroup
            value={[chartRange]}
            variant="outline"
            className="*:data-[slot=toggle-group-item]:px-4!"
          >
            <Link href={buildRangeHref("month")}>
              <ToggleGroupItem value="month">Mês</ToggleGroupItem>
            </Link>
            <Link href={buildRangeHref("week")}>
              <ToggleGroupItem value="week">Semana</ToggleGroupItem>
            </Link>
          </ToggleGroup>

          {chartRange === "week" && (
            <WeekNavigator
              currentWeek={week}
              month={month}
              minWeek={minWeek}
              maxWeek={maxWeek}
            />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-currentBalance)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-currentBalance)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
                  }
                  indicator="dot"
                />
              }
            />
            <Area dataKey="currentBalance" type="monotone" fill="url(#fillBalance)" stroke="var(--color-currentBalance)" />
            <Area dataKey="expense" type="monotone" fill="url(#fillExpense)" stroke="var(--color-expense)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}