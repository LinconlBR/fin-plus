import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { BalanceProjection } from "@/lib/reports"

export function ProjectedBalanceCard({ projection }: { projection: BalanceProjection }) {
  return (
    <Card className={projection.hasEnoughData ? "flex-1 border-primary/40" : "flex-1"}>
      <CardHeader>
        <CardTitle>Saldo projetado</CardTitle>
      </CardHeader>
      <CardContent>
        {projection.hasEnoughData ? (
          <>
            <p className="text-3xl font-semibold tabular-nums">
              {formatCurrency(projection.projectedBalance)}
            </p>
            <p className="text-sm text-muted-foreground">
              com base na média dos últimos 3 meses
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Dados insuficientes: precisamos de pelo menos 2 meses de histórico para
            projetar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}