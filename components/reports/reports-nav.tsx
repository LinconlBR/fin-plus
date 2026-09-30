"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { parsePeriod } from "@/lib/reports"

const tabs = [
	{ label: "Visão Geral", route: "/reports" },
	{ label: "Gastos por Categoria", route: "/reports/categories" },
	{ label: "Receitas vs despesas", route: "/reports/income-vs-expense" },
	{ label: "Comparativo de períodos", route: "/reports/period-comparison" },
	{ label: "Evolução das metass", route: "/reports/goals-evolution" },
	{ label: "Orçamento vs realizado", route: "/reports/budget-vs-actual" },
	{ label: "Projeção de saldo", route: "/reports/balance-projection" },
] as const

export function ReportsNav() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const period = parsePeriod(searchParams.get("period") ?? undefined)

	return (
		<nav className="flex flex-col gap-4">
			<div className="inline-flex w-fit rounded-md border p-1">
				<Link
					href={`${pathname}?period=month`}
					className={`rounded px-3 py-1.5 text-sm ${period === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
				>
					Mês
				</Link>
				<Link
					href={`${pathname}?period=year`}
					className={`rounded px-3 py-1.5 text-sm ${period === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
				>
					Ano
				</Link>
			</div>

			<div className="flex flex-wrap gap-2">
				{tabs.map(({ label, route }) => (
					<Link
						key={route}
						href={`${route}?period=${period}`}
						className={`rounded-md px-3 py-2 text-sm ${pathname === route ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
					>
						{label}
					</Link>
				))}
			</div>
		</nav>
	)
}
