import { createClient } from "@/lib/supabase/server"

// SERVER COMPONENT: por padrão, toda página no App Router já roda no servidor — não
// precisa de "use client" aqui. Isso permite usar await direto no corpo do
// componente (algo impossível em componentes React tradicionais do lado do
// navegador), buscando dados sem useEffect nem estado de loading manual.
export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // RLS EM AÇÃO: a policy da tabela profiles só permite SELECT onde
    // auth.uid() = id. Ou seja, mesmo filtrando por user?.id aqui no código, a
    // segurança real de "só ver o próprio perfil" já vem garantida pelo banco —
    // esse filtro no .eq() é redundante como proteção, mas necessário pra buscar
    // a linha certa (sem ele, o Supabase ainda aplicaria RLS, só que sem saber
    // qual linha específica você quer).
    const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("id", user?.id)
     .single()

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Bem-vindo ao seu painel de controle , <span className="font-bold">{profile?.full_name}</span>!
      </p>
    </div>
  )
}