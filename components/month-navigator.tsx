"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

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

// minMonth/maxMonth são opcionais: sem eles o navegador não tem limite
// (é o caso de Orçamentos, que continua como estava).
export function MonthNavigator({
  currentMonth,
  minMonth,
  maxMonth,
}: {
  currentMonth: string
  minMonth?: string
  maxMonth?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildHref = (month: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("month", month)
    return `${pathname}?${params.toString()}`
  }

  const previousMonth = shiftMonth(currentMonth, -1)
  const nextMonth = shiftMonth(currentMonth, 1)
  // Strings "YYYY-MM" comparam corretamente com <= e >=, sem converter pra Date.
  const canGoPrevious = !minMonth || previousMonth >= minMonth
  const canGoNext = !maxMonth || nextMonth <= maxMonth

  return (
    <div className="flex items-center gap-2">
      {canGoPrevious ? (
        <Link
          href={buildHref(previousMonth)}
          aria-label="Mês anterior"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        // Sem <Link> em volta: botão desabilitado dentro de link é pouco confiável.
        <Button variant="outline" size="icon" aria-label="Mês anterior" disabled>
          <ChevronLeft className="size-4" />
        </Button>
      )}

      <span className="min-w-32 text-center text-sm font-medium capitalize">
        {formatMonthLabel(currentMonth)}
      </span>

      {canGoNext ? (
        <Link
          href={buildHref(nextMonth)}
          aria-label="Próximo mês"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <Button variant="outline" size="icon" aria-label="Próximo mês" disabled>
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )
}