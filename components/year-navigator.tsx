"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clampMonth } from "@/lib/reports"

// "2026-03" + 1 ano = "2027-03": o mês do ano se mantém, só o ano anda.
function shiftYear(month: string, delta: number): string {
  const [year, m] = month.split("-")
  return `${Number(year) + delta}-${m}`
}

// O ano exibido vem do mês-âncora da URL (?month=2026-03 -> 2026). Os limites são
// os mesmos do MonthNavigator, então os dois navegadores concordam sobre o que existe.
export function YearNavigator({
  currentMonth,
  minMonth,
  maxMonth,
}: {
  currentMonth: string
  minMonth: string
  maxMonth: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const year = Number(currentMonth.slice(0, 4))
  const minYear = Number(minMonth.slice(0, 4))
  const maxYear = Number(maxMonth.slice(0, 4))

  // Andar um ano pode cair antes da primeira transação ou depois de hoje:
  // o clampMonth prende o destino dentro dos limites.
  const buildHref = (delta: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("month", clampMonth(shiftYear(currentMonth, delta), minMonth, maxMonth))
    return `${pathname}?${params.toString()}`
  }

  const canGoPrevious = year - 1 >= minYear
  const canGoNext = year + 1 <= maxYear

  return (
    <div className="flex items-center gap-2">
      {canGoPrevious ? (
        <Link href={buildHref(-1)}>
          <Button variant="outline" size="icon" aria-label="Ano anterior">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" aria-label="Ano anterior" disabled>
          <ChevronLeft className="size-4" />
        </Button>
      )}

      <span className="min-w-32 text-center text-sm font-medium tabular-nums">{year}</span>

      {canGoNext ? (
        <Link href={buildHref(1)}>
          <Button variant="outline" size="icon" aria-label="Próximo ano">
            <ChevronRight className="size-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" aria-label="Próximo ano" disabled>
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )
}