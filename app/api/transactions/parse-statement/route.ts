import { extractText, getDocumentProxy } from "unpdf"

import { createClient } from "@/lib/supabase/server"
import { runInsight } from "@/lib/ai-insight"
import { buildInsightDeps } from "@/lib/ai-deps"
import { readStatement, type AskAi } from "@/lib/statement-reader"

// O proxy não roda em /api, então esta rota confere o login por conta própria.

const MAX_PDF_BYTES = 4 * 1024 * 1024 // a Vercel recusa corpos acima de ~4,5 MB
const MAX_PAGES = 30
const MIN_TEXT_CHARS = 20

const fail = (error: string, status: number) => Response.json({ error }, { status })

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("Não autenticado", 401)

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) return fail("Envie um arquivo PDF", 400)
  if (file.size > MAX_PDF_BYTES) return fail("O PDF é grande demais (máximo 4 MB)", 413)

  const bytes = new Uint8Array(await file.arrayBuffer())
  // Confere o conteúdo, não só a extensão: o nome do arquivo vem do cliente.
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    return fail("Este arquivo não é um PDF válido", 400)
  }

  let text: string
  try {
    const pdf = await getDocumentProxy(bytes)
    if (pdf.numPages > MAX_PAGES) return fail(`O PDF tem páginas demais (máximo ${MAX_PAGES})`, 413)
    text = (await extractText(pdf, { mergePages: true })).text
  } catch {
    return fail("Não consegui abrir este PDF. Ele pode estar protegido por senha ou corrompido.", 422)
  }
  if (text.trim().length < MIN_TEXT_CHARS) {
    return fail("Este PDF não tem texto selecionável (parece escaneado). Use o CSV ou o XLSX do banco.", 422)
  }

  const { data: categories } = await supabase.from("categories").select("name")
  const categoryNames = (categories ?? []).map((c) => c.name as string)

  // A IA só é chamada se as regras não reconhecerem o layout. Passa pelas mesmas
  // proteções das outras ações de IA: plano, cota por hora e falha fechada.
  const askAi: AskAi = async (prompt) =>
    runInsight(await buildInsightDeps(4000), (p) => p, prompt, "leitura de extrato", prompt.length)

  const result = await readStatement(text, { categoryNames, askAi })
  if (!result.ok) return fail(result.error, 422)

  return Response.json(
    { rows: result.rows, method: result.method, notices: result.notices },
    { headers: { "Cache-Control": "no-store" } }
  )
}
