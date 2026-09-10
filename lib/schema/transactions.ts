
import { z } from "zod"

const schema = z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().positive("Valor deve ser maior que zero"),
    type: z.enum(["income", "expense"], "Tipo de transação inválido"),
    categoryId: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Data inválida",
    }),
    
})