import { buildOverviewSummaryText, getOverviewInsight, toDateString } from "@/lib/reports"
import { getMonthOverviewInput } from "@/lib/overview"
import { TipsReport } from "@/components/tips/tips-report"

// Server component: calcula a visão geral do mês atual e entrega o texto pronto ao
// componente de cliente, que acrescenta orçamentos e metas antes de chamar a IA.
export async function TipsContent() {
  const month = toDateString(new Date()).slice(0, 7)
  const input = await getMonthOverviewInput(month)

  return (
    <TipsReport
      overviewSummary={buildOverviewSummaryText(input)}
      overviewFallback={getOverviewInsight(input)}
    />
  )
}
