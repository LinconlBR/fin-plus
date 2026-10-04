import { SnapshotCard } from "@/components/reports/overview/snapshot-card"
import { formatCurrency } from "@/lib/format"
import type { BalanceProjection } from "@/lib/reports"

export function ProjectionSnapshot({
  projection,
  href,
}: {
  projection: BalanceProjection
  href: string
}) {
  return (
    <SnapshotCard title="Projeção de saldo" href={href}>
      {projection.hasEnoughData ? (
        <div className="space-y-1">
          <p className="text-3xl font-semibold tabular-nums">
            {formatCurrency(projection.projectedBalance)}
          </p>
          <p className="text-sm text-muted-foreground">
            daqui a {projection.monthsAhead} meses, se o ritmo dos últimos 3 meses
            continuar
          </p>
          <p className="pt-2 text-xs text-muted-foreground">
            Sobra média: {formatCurrency(projection.monthlyNet)} por mês
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Dados insuficientes: precisamos de pelo menos 2 meses de histórico para
          projetar.
        </p>
      )}
    </SnapshotCard>
  )
}