"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { dashboardLayoutSchema } from "@/lib/schema/dashboard-layout"

type ActionResult = { error?: string } | undefined

// Salva a ordem e a visibilidade dos blocos do Dashboard. O argumento vem do
// cliente, então o tipo declarado não é garantia: o Zod confere de novo aqui.
export async function saveDashboardLayout(layout: unknown): Promise<ActionResult> {
  const parsed = dashboardLayoutSchema.safeParse(layout)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Layout inválido" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      dashboard_layout: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
}
