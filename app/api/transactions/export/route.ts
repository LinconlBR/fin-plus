import { createClient } from "@/lib/supabase/server"
import { canUseFeature } from "@/lib/plans"
import {
  exportFilename,
  parseExportParams,
  transactionsToCsv,
  type ExportTransaction,
} from "@/lib/transaction-export"
import { buildTransactionsPdf } from "@/lib/transaction-pdf"

// O proxy não roda em /api, então esta rota confere o login por conta própria.
// A RLS do banco garante que só as transações da própria pessoa voltam.

const PAGE_SIZE = 1000 // limite de linhas por consulta do PostgREST
const MAX_ROWS = 20_000 // teto para ninguém travar o servidor com um export gigante

type Row = {
  date: string
  description: string | null
  type: "income" | "expense"
  amount: number | string
  categories: { name: string } | null
}

export async function GET(request: Request) {
  const params = parseExportParams(new URL(request.url).searchParams)
  if (!params.ok) return Response.json({ error: params.error }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Hoje todo mundo é "free" com a trava desligada (lib/plans.ts).
  if (params.format === "pdf" && !canUseFeature("free", "pdf_export")) {
    return Response.json({ error: "Disponível no plano Plus" }, { status: 403 })
  }

  const transactions: ExportTransaction[] = []
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    let query = supabase
      .from("transactions")
      .select("date, description, type, amount, categories(name)")
      // id como desempate: sem ele, a paginação pode repetir ou pular linhas
      // de datas iguais entre uma página e outra.
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (params.from) query = query.gte("date", params.from)
    if (params.to) query = query.lte("date", params.to)

    const { data, error } = await query
    if (error) return Response.json({ error: "Erro ao buscar transações" }, { status: 500 })

    for (const row of (data ?? []) as unknown as Row[]) {
      transactions.push({
        date: row.date,
        description: row.description ?? "Sem descrição",
        category: row.categories?.name ?? "Sem categoria",
        type: row.type,
        amount: Number(row.amount),
      })
    }
    if (!data || data.length < PAGE_SIZE) break
  }

  const filename = exportFilename(params.format, params.from, params.to)
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  }

  if (params.format === "csv") {
    return new Response(transactionsToCsv(transactions), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    })
  }

  return new Response(buildTransactionsPdf(transactions, params), {
    headers: { ...headers, "Content-Type": "application/pdf" },
  })
}
