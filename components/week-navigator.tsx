"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { getWeekRangeWithinMonth } from "@/lib/reports"

function shiftWeek(week: string, deltaDays: number): string {
  const [year, m, d] = week.split("-").map(Number)
  const date = new Date(year, m - 1, d + deltaDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

// "2026-10-01" -> "01/10/2026". Sem Date nem Intl: o texto sai idêntico no
// servidor e no navegador, sem risco de diferença de fuso ou de hidratação.
function formatDate(date: string): string {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function formatWeekLabel(week: string, month: string): string {
  // A semana é recortada pelo mês: o rótulo mostra só os dias que o gráfico mostra.
  const { start, end } = getWeekRangeWithinMonth(week, month)
  return start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`
}

// minWeek/maxWeek chegam prontos do servidor (getWeekBounds). O componente não
// lê o relógio: assim servidor e navegador sempre concordam sobre o que é "hoje".
export function WeekNavigator({
  currentWeek,
  month,
  minWeek,
  maxWeek,
}: {
  currentWeek: string
  month: string
  minWeek: string
  maxWeek: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildHref = (week: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("week", week)
    return `${pathname}?${params.toString()}`
  }

  const previousWeek = shiftWeek(currentWeek, -7)
  const nextWeek = shiftWeek(currentWeek, 7)
  const canGoPrevious = previousWeek >= minWeek
  const canGoNext = nextWeek <= maxWeek

  return (
    <div className="flex items-center gap-2">
      {canGoPrevious ? (
        <Link
          href={buildHref(previousWeek)}
          aria-label="Semana anterior"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <Button variant="outline" size="icon" aria-label="Semana anterior" disabled>
          <ChevronLeft className="size-4" />
        </Button>
      )}

      <span className="min-w-32 text-center text-sm font-medium">
        {formatWeekLabel(currentWeek, month)}
      </span>

      {canGoNext ? (
        <Link
          href={buildHref(nextWeek)}
          aria-label="Próxima semana"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <Button variant="outline" size="icon" aria-label="Próxima semana" disabled>
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )
}