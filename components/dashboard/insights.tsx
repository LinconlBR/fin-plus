import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

// Estrutura pronta pro painel de insights — o conteúdo real (baseado em
// regras, ou gerado por IA, igual fizemos em Orçamentos) ainda será definido.
export function DashboardInsights() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="size-4 text-accent-violet" />
        <CardTitle>Dicas Financeiras</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Em breve: insights personalizados sobre seus hábitos financeiros.
        </p>
      </CardContent>
    </Card>
  )
}