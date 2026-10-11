import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Garante um usuário autenticado perto de onde o dado é lido.
//
// O proxy.ts já redireciona visitantes, mas é só a primeira camada (e já
// existiu bypass de proxy/middleware em versões do Next). A RLS do banco
// protege os dados; isto protege o próprio código do servidor: se o proxy
// falhar, a página não renderiza com "usuário indefinido".
//
// Atenção: layouts não rodam de novo em navegações client-side entre páginas
// do mesmo layout. Por isso as Server Actions continuam conferindo o usuário
// individualmente, e este helper é a rede de segurança do carregamento
// inicial.
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return { supabase, user }
}
