// Server Action que valida a sessão e cria novas transações financeiras no Supabase.
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTransaction(formData: FormData) {     

    const supabase = await createClient();

    // pega o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    // 2. extrair os campos do formData: amount, type, description, date, category_id

    const amount = formData.get("amount")?.toString() ?? "0"
    const type = formData.get("type")?.toString() ?? "expense"
    const description = formData.get("description")?.toString() ?? "sem descrição"
    const date = formData.get("date")?.toString() ?? new Date().toISOString()
    const category_id = formData.get("category_id")?.toString() ?? ""

    

    // 3. inserir na tabela transactions, incluindo user_id = user.id
    const { error } = await supabase.from("transactions").insert({
        amount: parseFloat(amount),
        type,
        description,
        date,
        category_id,
        user_id: user?.id,
    })

  // 4. se der erro, decida o que fazer
    if (error) {
        throw new Error(error.message)
    }

  // 5. revalidatePath("/transactions") — avisa o Next.js pra buscar dados frescos
    revalidatePath("/transactions")

}