import { Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DailyTipCard({ tip }: { tip: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="size-4 text-accent-violet" />
        <CardTitle>Dica do Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90">{tip}</p>
      </CardContent>
    </Card>
  )
}
