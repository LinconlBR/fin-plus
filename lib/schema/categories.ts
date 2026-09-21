import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["income", "expense"], "Tipo inválido"),
  icon: z.string().min(1, "Ícone é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
})