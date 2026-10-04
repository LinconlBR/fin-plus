"use client"

import { useQuery } from "@tanstack/react-query"
import { Lightbulb } from "lucide-react"
import { generateOverviewInsight } from "@/lib/actions/ai"

// Mesmo padrão de Orçamentos e Metas: a IA responde quando consegue, e o texto
// por regras (calculado no servidor) cobre a espera e qualquer falha.
export function OverviewInsight({
  summary,
  fallback,
}: {
  summary: string
  fallback: string
}) {
  const { data: aiInsight } = useQuery({
    queryKey: ["overview-insight", summary],
    queryFn: () => generateOverviewInsight(summary),
    enabled: summary !== "", // sem movimento no período, não há o que analisar
    staleTime: 1000 * 60 * 30, // mesmos dados = mesmo texto: não gasta a cota da IA a cada visita
  })

  const text = aiInsight || fallback
  if (!text) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-accent-violet/10 p-4">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-violet" />
      <p className="text-sm text-foreground/90">{text}</p>
    </div>
  )
}