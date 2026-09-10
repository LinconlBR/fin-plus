
import { z } from "zod"

export const transactionSchema = z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().positive("Valor deve ser maior que zero"),
    type: z.enum(["income", "expense"], "Tipo de transação inválido"),
    category_id: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Data inválida",
    }),

}) 

 