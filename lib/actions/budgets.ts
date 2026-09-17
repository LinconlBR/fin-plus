"use server"


import { createClient } from "@/lib/supabase/server"
import { budgetSchema } from "@/lib/schema/budgets"


export async function createBudget(formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = budgetSchema.safeParse({
        category_id: formData.get("category_id"),
        target_amount: Number(formData.get("target_amount")),
        period: formData.get("period"),
        is_recurring: formData.get("is_recurring") === "true",
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
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

    // extrair os dados validados do parsed.data 
    // O TypeScript não consegue garantir que formData.get() retorne uma string, então usamos o operador de coalescência nula (??) 
    // para fornecer valores padrão caso sejam nulos ou indefinidos.
    const category_id = parsed.data.category_id?.toString() ?? ""
    const target_amount = parsed.data.target_amount?.toString() ?? "0"
    const period = parsed.data.period?.toString() ?? "monthly"
    const is_recurring = parsed.data.is_recurring ?? false
    const start_date = parsed.data.start_date?.toString() ?? new Date().toISOString()
    const end_date = parsed.data.end_date?.toString() ?? null


    // 3. inserir na tabela budgets
    const { error } = await supabase.from("budgets").insert({
        category_id,
        target_amount: parseFloat(target_amount),
        period,
        is_recurring,
        start_date,
        end_date,
        user_id: user?.id,
    })

    if (error) {
        throw new Error("Erro ao criar orçamento")
    }

}


export async function updateBudget(id: string, formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = budgetSchema.safeParse({
        category_id: formData.get("category_id"),
        target_amount: Number(formData.get("target_amount")),
        period: formData.get("period"),
        is_recurring: formData.get("is_recurring") === "true",
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
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
    
    // extrair os dados validados do parsed.data 
    // O TypeScript não consegue garantir que formData.get() retorne uma string, então usamos o operador de coalescência nula (??) 
    // para fornecer valores padrão caso sejam nulos ou indefinidos.
    const category_id = parsed.data.category_id?.toString() ?? ""
    const target_amount = parsed.data.target_amount?.toString() ?? "0"
    const period = parsed.data.period?.toString() ?? "monthly"
    const is_recurring = parsed.data.is_recurring ?? false
    const start_date = parsed.data.start_date?.toString() ?? new Date().toISOString()
    const end_date = parsed.data.end_date?.toString() ?? null


    // 3. atualizar na tabela budgets
    const { error } = await supabase.from("budgets").update({
        category_id,
        target_amount: parseFloat(target_amount),
        period,
        is_recurring,
        start_date,
        end_date,
        user_id: user?.id,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    
    if (error) {
        throw new Error("Erro ao atualizar orçamento")
    }

  
}


// serve Action para deletar um orçamento pelo id
export async function deleteBudget(id: string) {
    // 1. criar o client do Supabase
    const supabase = await createClient();

    // pega o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    // 2. deletar da tabela budgets
    const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

    if (error) {
        throw new Error("Erro ao deletar orçamento")
    }
  
}
