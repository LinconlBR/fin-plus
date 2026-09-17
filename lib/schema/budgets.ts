    // Esquema de validação para o orçamento, usando a biblioteca Zod.
    import { z } from "zod"

    export const budgetSchema = z
    .object({
        category_id: z.string().min(1, "Categoria é obrigatória"),
        target_amount: z.number().positive("Valor deve ser maior que zero"),
        period: z.enum(["weekly", "monthly"]),
        is_recurring: z.boolean(),
        start_date: z.string().min(1, "Data de início é obrigatória"),
        end_date: z.string().optional(),
    })
    .refine((data) => data.is_recurring || !!data.end_date, {
        message: "Data final é obrigatória para orçamentos únicos",
        path: ["end_date"],
    })