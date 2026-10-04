import { SnapshotCard } from "@/components/reports/overview/snapshot-card"
import { CategoryDonut } from "@/components/reports/categories/category-donut"
import { formatCurrency, formatPercent } from "@/lib/format"

type Item = {
  id: string
  name: string
  color: string
  total: number
  percentage: number
}

export function CategorySnapshot({
  items,
  total,
  href,
}: {
  items: Item[]
  total: number
  href: string
}) {
  const top = items.slice(0, 3)

  return (
    <SnapshotCard title="Gastos por categoria" href={href}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem despesas neste período.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <CategoryDonut items={items} total={total} />
          <ul className="w-full space-y-3">
            {top.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPercent(item.percentage)} · {formatCurrency(item.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SnapshotCard>
  )
}