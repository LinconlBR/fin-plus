import Link from "next/link"
import { SnapshotCard } from "@/components/reports/overview/snapshot-card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercent } from "@/lib/format"

type Summary = {
  totalSaved: number
  totalTarget: number
  overallPercentage: number
  activeCount: number
}

export function GoalsSnapshot({
  summary,
  hasGoals,
  href,
}: {
  summary: Summary
  hasGoals: boolean
  href: string
}) {
  return (
    <SnapshotCard title="Metas" href={hasGoals ? href : undefined}>
      {hasGoals ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-semibold tabular-nums">
              {formatPercent(summary.overallPercentage)}
            </p>
            <span className="text-sm text-muted-foreground">
              {summary.activeCount}{" "}
              {summary.activeCount === 1 ? "meta ativa" : "metas ativas"}
            </span>
          </div>
          <Progress
            value={summary.overallPercentage}
            indicatorClassName="bg-success"
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatCurrency(summary.totalSaved)}</span>
            <span>{formatCurrency(summary.totalTarget)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Você ainda não tem metas.{" "}
          <Link href="/goals" className="underline underline-offset-4">
            Criar uma meta
          </Link>
        </p>
      )}
    </SnapshotCard>
  )
}