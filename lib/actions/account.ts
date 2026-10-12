"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  profileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/lib/schema/settings"

type ActionResult = { error?: string; success?: boolean }

// Os argumentos vêm do cliente: o tipo declarado não é garantia, o Zod confere.
async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { supabase, user } = await getUser()
  if (!user) return { error: "Usuário não autenticado" }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id)
  if (error) return { error: error.message }

  // Mantém o nome também nos metadados do Auth (usado em novos logins sociais).
  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } })

  revalidatePath("/", "layout")
  return { success: true }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { supabase, user } = await getUser()
  if (!user || !user.email) return { error: "Usuário não autenticado" }

  // Reautentica com a senha atual: quem pegou uma sessão aberta não consegue
  // trocar a senha sem conhecê-la.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  })
  if (authError) return { error: "Senha atual incorreta" }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  })
  if (error) return { error: error.message }

  return { success: true }
}

export async function deleteAccount(input: unknown): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { supabase, user } = await getUser()
  if (!user) return { error: "Usuário não autenticado" }

  // Função SECURITY DEFINER (db/migrations/20261013_delete_my_account.sql):
  // apaga só o usuário logado em auth.users e o resto cai em cascata.
  const { error } = await supabase.rpc("delete_my_account")
  if (error) return { error: "Não foi possível excluir a conta. Tente novamente." }

  await supabase.auth.signOut()
  redirect("/auth/login")
}
