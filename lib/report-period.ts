import { createClient } from "@/lib/supabase/server"
import { resolvePeriodParams } from "@/lib/reports"

type SearchParams = Record<string, string | string[] | undefined>

// Ponto único de entrada das páginas de relatório com navegação: lê a URL, descobre
// o mês da primeira transação e devolve período e mês já validados e presos nos limites.
export async function resolveReportPeriod(searchParams: Promise<SearchParams>) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: first } = await supabase
    .from("transactions")
    .select("date")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle()

  return resolvePeriodParams(params, first?.date)
}