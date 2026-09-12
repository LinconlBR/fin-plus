

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

    if (code ) {
    const supabase = await createClient()
    const {  error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
    return NextResponse.redirect("/auth/login?error=Erro ao trocar código por sessão") + `&error_description=${encodeURIComponent(error.message)}`
    }

    // Redireciona para o dashboard após a autenticação bem-sucedida
    return NextResponse.redirect("/dashboard")
    }

    return NextResponse.redirect("/auth/login?error=Callback de autenticação falhou") + `&error_description=${encodeURIComponent("Código de autenticação ausente na resposta")}`
}
