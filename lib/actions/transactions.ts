// Server Action que valida a sessão e cria novas transações financeiras no Supabase.
"use server"


import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { transactionSchema } from "@/lib/schema/transactions"


export async function createTransaction(formData: FormData) {     
    // 1. validar os dados do formData com o Zod
    const parsed = transactionSchema.safeParse({
        amount: Number(formData.get("amount")),
        type: formData.get("type"),
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

    // extrair os dados validados do parsed.data 
    // O TypeScript não consegue garantir que formData.get() retorne uma string, então usamos o operador de coalescência nula (??) 
    // para fornecer valores padrão caso sejam nulos ou indefinidos.
    const amount = parsed.data.amount?.toString() ?? "0"
    const type = parsed.data.type?.toString() ?? "expense"
    const description = parsed.data.description?.toString() ?? "sem descrição"
    const date = parsed.data.date?.toString() ?? new Date().toISOString()
    const category_id = parsed.data.category_id?.toString() ?? ""

    

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