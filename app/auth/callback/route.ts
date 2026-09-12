

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  _context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("error", "Erro ao trocar código por sessão")
      loginUrl.searchParams.set("error_description", error.message)
      return NextResponse.redirect(loginUrl)
    }

    // Redireciona para o dashboard após a autenticação bem-sucedida
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const loginUrl = new URL("/auth/login", request.url)
  loginUrl.searchParams.set("error", "Callback de autenticação falhou")
  loginUrl.searchParams.set(
    "error_description",
    "Código de autenticação ausente na resposta",
  )
  return NextResponse.redirect(loginUrl)
}
