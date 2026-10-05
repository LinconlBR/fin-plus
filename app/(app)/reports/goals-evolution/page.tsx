import { parsePeriod } from "@/lib/reports"
import { GoalsEvolutionContent } from "@/components/reports/goals-evolution/goals-evolution-content"

export default async function GoalsEvolutionPage(
  props: PageProps<"/reports/goals-evolution">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  return <GoalsEvolutionContent period={parsedPeriod} />
}