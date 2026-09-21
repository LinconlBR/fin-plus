"use server"

import { createClient } from "@/lib/supabase/server"
import { categorySchema } from "@/lib/schema/categories"

export async function createCategory(formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = categorySchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        icon: formData.get("icon"),
        color: formData.get("color"),
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

    // 3. inserir na tabela categories, incluindo user_id = user.id

    const { error } = await supabase.from("categories").insert({
        name: parsed.data.name,
        type: parsed.data.type, 
        icon: parsed.data.icon,
        color: parsed.data.color,
        user_id: user?.id,
    })

    if (error) {
        throw new Error(error.message)
    }
}

export async function updateCategory(id: string, formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = categorySchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        icon: formData.get("icon"),
        color: formData.get("color"),
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

    // 3. atualizar na tabela categories, incluindo user_id = user.id
    const { error } = await supabase.from("categories").update({
        name: parsed.data.name,
        type: parsed.data.type, 
        icon: parsed.data.icon,
        color: parsed.data.color,
        user_id: user?.id,
    })
    .eq("id", id)
    .eq("user_id", user.id)

    if (error) {
        throw new Error(error.message)
    }
}


export async function deleteCategory(id: string) {
    // 1. criar o client do Supabase
    const supabase = await createClient();

    // pega o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }
    // 2. deletar na tabela categories, incluindo user_id = user.id
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user?.id)
    
    if (error) {
        throw new Error(error.message)
    }
}
