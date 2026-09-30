import { parsePeriod } from "@/lib/reports"
import { CategoriesContent } from "@/components/reports/categories/categories-content"

export default async function CategoriesPage(
  props: PageProps<"/reports/categories">
) {
  const { period } = await props.searchParams
  const parsedPeriod = parsePeriod(period)

  return <CategoriesContent period={parsedPeriod} />
}