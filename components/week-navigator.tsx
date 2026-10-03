"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function shiftWeek(week: string, deltaDays: number): string {
  const [year, m, d] = week.split("-").map(Number)
  const date = new Date(year, m - 1, d + deltaDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function formatWeekLabel(week: string): string {
  const [year, m, d] = week.split("-").map(Number)
  // `week` já É o domingo daquela semana (é assim que guardamos na URL),
  // então não precisamos recalcular o início — só achar o fim, +6 dias.
  const startOfWeek = new Date(year, m - 1, d)
  const endOfWeek = new Date(year, m - 1, d + 6)

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
  return `${startOfWeek.toLocaleDateString("pt-BR", options)} - ${endOfWeek.toLocaleDateString("pt-BR", options)}`
}

export function WeekNavigator({ currentWeek }: { currentWeek: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildHref = (week: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("week", week)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={buildHref(shiftWeek(currentWeek, -7))}>
        <Button variant="outline" size="icon">
          <ChevronLeft className="size-4" />
        </Button>
      </Link>
      <span className="min-w-32 text-center text-sm font-medium capitalize">
        {formatWeekLabel(currentWeek)}
      </span>
      <Link href={buildHref(shiftWeek(currentWeek, 7))}>
        <Button variant="outline" size="icon">
          <ChevronRight className="size-4" />
        </Button>
      </Link>
    </div>
  )
}