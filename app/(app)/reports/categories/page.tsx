import { parsePeriod , getPreviousPeriodRangeStrings, getPeriodRangeStrings ,groupExpensesByCategory, percentChange , ExpenseRow} from "@/lib/reports"
import { createClient } from "@/lib/supabase/server"

export default async function CategoriesPage(props: PageProps<"/reports/categories">) {
  const { period } = await props.searchParams
    const parsedPeriod = parsePeriod(period);

    const currentPeriod = getPeriodRangeStrings(parsedPeriod, new Date());
    const previousPeriod = getPreviousPeriodRangeStrings(parsedPeriod, new Date())
    const supabase = await createClient();
     

    const [current, previous  ] = await Promise.all([ 
     supabase
     .from("transactions")
     .select("amount, category_id, categories(name, color)")
     .eq("type", "expense")
     .gte("date", currentPeriod.start)
     .lte("date", currentPeriod.end)
     .throwOnError()
     ,
      supabase
     .from("transactions")
     .select("amount, category_id, categories(name, color)")
     .eq("type", "expense")
     .gte("date", previousPeriod.start)
     .lte("date", previousPeriod.end)
     .throwOnError()
    ])
    
    const currentGroups = groupExpensesByCategory((current.data ?? []) as unknown as ExpenseRow[])
    const previousGroups = groupExpensesByCategory((previous.data ?? []) as unknown as ExpenseRow[])

    const categories = currentGroups.items.map((item) => {
      const previousItem = previousGroups.items.find((p) => p.id === item.id)
      const change = percentChange(item.total, previousItem?.total ?? 0)
      const percentage = (item.total / currentGroups.total) * 100

      return { ...item, change, percentage }
    })


    return (
        <ul>
          {categories.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>{" "}
              <span>{item.total.toFixed(2)}</span>{" "}
              <span>{item.change === null ? "—" : item.change.toFixed(1)}</span>
              <span>{item.percentage.toFixed(1)}</span>
            </li>
          ))}
        </ul>
    )
}