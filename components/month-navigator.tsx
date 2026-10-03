"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number)
  const date = new Date(year, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number)
  const date = new Date(year, m - 1, 1)
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

export function MonthNavigator({ currentMonth }: { currentMonth: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildHref = (month: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("month", month)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={buildHref(shiftMonth(currentMonth, -1))}>
        <Button variant="outline" size="icon">
          <ChevronLeft className="size-4" />
        </Button>
      </Link>
      <span className="min-w-32 text-center text-sm font-medium capitalize">
        {formatMonthLabel(currentMonth)}
      </span>
      <Link href={buildHref(shiftMonth(currentMonth, 1))}>
        <Button variant="outline" size="icon">
          <ChevronRight className="size-4" />
        </Button>
      </Link>
    </div>
  )
}