"use server"

import { createClient } from "@/lib/supabase/server"
import { goalContributionSchema } from "@/lib/schema/goal-contribution"

export async function createGoalContribution(formData: FormData) {
    // 1. validar os dados do formData com o Zod
    const parsed = goalContributionSchema.safeParse({
        goal_id: formData.get("goal_id")?.toString() || undefined,
        amount: Number(formData.get("amount")),
        date: formData.get("date")?.toString() || undefined,
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

    // 3. inserir na tabela goal_contributions, incluindo user_id = user.id
    const { error } = await supabase.from("goal_contributions").insert({
        goal_id: parsed.data.goal_id,
        amount: parsed.data.amount,
        date: parsed.data.date,
        user_id: user?.id,
    })

    if (error) {
        throw new Error(error.message)
    }

}