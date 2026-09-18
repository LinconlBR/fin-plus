// Server Action que valida a sessão e cria novas transações financeiras no Supabase.
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { transactionSchema } from "@/lib/schema/transactions"

export async function createTransaction(formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = transactionSchema.safeParse({
        amount: Number(formData.get("amount")),
        description: formData.get("description"),
        date: formData.get("date"),
        category_id: formData.get("category_id"),
    })

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos")
    }

    // 2. criar o client do Supabase
    const supabase = await createClient();

    // pega o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    const amount = parsed.data.amount?.toString() ?? "0"
    const description = parsed.data.description?.toString() ?? "sem descrição"
    const date = parsed.data.date?.toString() ?? new Date().toISOString()
    const category_id = parsed.data.category_id?.toString() ?? ""

    // 2.5. buscar o type da categoria escolhida — nunca confiamos num type
    // vindo do cliente, ele é sempre derivado da categoria real no banco.
    const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("type")
        .eq("id", category_id)
        .single()

    if (categoryError || !category) {
        throw new Error("Categoria inválida")
    }

    const type = category.type

    // 3. inserir na tabela transactions, incluindo user_id = user.id
    const { error } = await supabase.from("transactions").insert({
        amount: parseFloat(amount),
        type,
        description,
        date,
        category_id,
        user_id: user?.id,
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/transactions")
}

export async function updateTransaction(id: string, formData: FormData) {
    const parsed = transactionSchema.safeParse({
        amount: Number(formData.get("amount")),
        description: formData.get("description"),
        date: formData.get("date"),
        category_id: formData.get("category_id"),
    })

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos")
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    const amount = parsed.data.amount?.toString() ?? "0"
    const description = parsed.data.description?.toString() ?? "sem descrição"
    const date = parsed.data.date?.toString() ?? new Date().toISOString()
    const category_id = parsed.data.category_id?.toString() ?? ""

    const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("type")
        .eq("id", category_id)
        .single()

    if (categoryError || !category) {
        throw new Error("Categoria inválida")
    }

    const type = category.type

    const { error } = await supabase.from("transactions").update({
        amount: parseFloat(amount),
        type,
        description,
        date,
        category_id,
        user_id: user?.id,
    })
    .eq("id", id)
    .eq("user_id", user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/transactions")
}

// Server Action que valida a sessão e deleta transações financeiras no Supabase.
export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }
}