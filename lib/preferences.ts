import { createClient } from "@/lib/supabase/server"
import { DEFAULT_LAYOUT, normalizeLayout, type WidgetPreference } from "@/lib/dashboard-layout"

// Layout do Dashboard do usuário logado. A RLS garante que só a linha dele aparece.
// Se a leitura falhar, o Dashboard não pode quebrar por causa de uma preferência:
// cai no layout padrão.
export async function getDashboardLayout(): Promise<WidgetPreference[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_preferences")
    .select("dashboard_layout")
    .maybeSingle()

  if (error) {
    console.error("Erro ao ler o layout do dashboard:", error)
    return DEFAULT_LAYOUT.map((widget) => ({ ...widget }))
  }

  return normalizeLayout(data?.dashboard_layout)
}
