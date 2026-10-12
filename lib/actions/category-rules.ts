"use server"

import { createClient } from "@/lib/supabase/server"
import { categoryRulesPayloadSchema } from "@/lib/schema/category-rules"

type Result = { error: string } | { saved: number }

// Chamada depois de uma importação bem-sucedida. As regras são só uma ajuda
// para a próxima vez: o cliente ignora falhas aqui.
export async function saveCategoryRules(input: unknown): Promise<Result> {
  const parsed = categoryRulesPayloadSchema.safeParse(input)
  if (!parsed.success) return { error: "Regras inválidas" }
  if (parsed.data.length === 0) return { saved: 0 }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Usuário não autenticado" }

  // A categoria precisa ser da pessoa e do mesmo tipo da regra.
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, type")
  if (categoriesError) return { error: "Erro ao buscar categorias" }
  const types = new Map((categories ?? []).map((c) => [c.id as string, c.type as string]))

  const rules = parsed.data.filter((r) => types.get(r.category_id) === r.type)
  if (rules.length === 0) return { saved: 0 }

  const now = new Date().toISOString()
  const { error } = await supabase.from("category_rules").upsert(
    rules.map((r) => ({ ...r, user_id: user.id, updated_at: now })),
    { onConflict: "user_id,merchant_key,type" }
  )
  if (error) return { error: "Não foi possível salvar as regras" }

  return { saved: rules.length }
}
