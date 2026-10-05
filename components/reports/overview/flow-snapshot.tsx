import { SnapshotCard } from "@/components/reports/overview/snapshot-card"
import { MonthlyFlowChart } from "@/components/reports/income-vs-expense/monthly-flow-chart"
import type { MonthlyFlow } from "@/lib/reports"

export function FlowSnapshot({
  data,
  windowLabel,
  href,
}: {
  data: MonthlyFlow[]
  windowLabel: string
  href: string
}) {
  const isEmpty = data.every((m) => m.income === 0 && m.expense === 0)

  return (
    <SnapshotCard title="Receitas vs despesas" href={href}>
      <p className="mb-2 text-xs text-muted-foreground">{windowLabel}</p>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Sem lançamentos neste período.
        </p>
      ) : (
        <MonthlyFlowChart data={data} />
      )}
    </SnapshotCard>
  )
}