"use client"

import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { generateSavingsSuggestions } from "@/lib/actions/ai"
import { parseSavingsSuggestions, type SavingsSuggestion } from "@/lib/tips"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SavingsCard({
  summary,
  fallback,
}: {
  summary: string
  fallback: SavingsSuggestion[]
}) {
  const { data } = useQuery({
    queryKey: ["savings-suggestions", summary],
    queryFn: () => generateSavingsSuggestions(summary),
    enabled: summary !== "", // sem despesas, não há o que analisar
    staleTime: 1000 * 60 * 30, // mesmos dados = mesmas sugestões
  })

  const aiSuggestions = data ? parseSavingsSuggestions(data) : []
  // Se a IA falhar ou ainda não respondeu, mostra as sugestões por regras.
  const suggestions = aiSuggestions.length > 0 ? aiSuggestions : fallback

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestões de Economia</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Registre despesas para receber sugestões de economia.
          </p>
        ) : (
          <ul className="space-y-4">
            {suggestions.map((suggestion) => (
              <li key={suggestion.title} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-violet/15 text-accent-violet">
                  <Check className="size-3" />
                </span>
                <div>
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  {suggestion.detail && (
                    <p className="text-xs text-accent-violet">{suggestion.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
