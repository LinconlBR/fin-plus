

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

    if (state !== process.env.NEXT_PUBLIC_SUPABASE_STATE) {
        return NextResponse.redirect("/auth/login?error=Estado inválido")
    }

    if (code ) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
    return NextResponse.redirect("/auth/login?error=Erro ao trocar código por sessão")
    }

    // Redireciona para o dashboard após a autenticação bem-sucedida
    return NextResponse.redirect("/dashboard")
    }

    return NextResponse.redirect("/auth/login?error=Callback de autenticação falhou")
}
