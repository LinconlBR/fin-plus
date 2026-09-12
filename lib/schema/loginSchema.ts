
// Schema Zod que valida os campos obrigatórios e os valores permitidos do login.
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})
