"use server"

import { createClient } from "@/lib/supabase/server"
import { goalSchema } from "@/lib/schema/goals"


export async function createGoal(formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = goalSchema.safeParse({
        name: formData.get("name"),
        target_amount: Number(formData.get("target_amount")),
        deadline: formData.get("deadline")?.toString() || undefined,
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

    // 3. inserir na tabela goals, incluindo user_id = user.id
    const { error } = await supabase.from("goals").insert({
        name: parsed.data.name,
        target_amount: parsed.data.target_amount,
        deadline: parsed.data.deadline,
        user_id: user?.id,
    })

    if (error) {
        throw new Error(error.message)
    }

}


export async function updateGoal(id: string, formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = goalSchema.safeParse({
        name: formData.get("name"),
        target_amount: Number(formData.get("target_amount")),
        deadline: formData.get("deadline")?.toString() || undefined,
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

    // 3. atualizar na tabela goals, incluindo user_id = user.id
    const { error } = await supabase.from("goals").update({
        name: parsed.data.name,
        target_amount: parsed.data.target_amount,
        deadline: parsed.data.deadline,
        user_id: user?.id,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    
    if (error) {
        throw new Error(error.message)
    }
}

export async function deleteGoal(id: string) {
    // 1. criar o client do Supabase
    const supabase = await createClient();

    // pega o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    // 2. deletar na tabela goals, incluindo user_id = user.id
    const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
        throw new Error(error.message)
    }

}