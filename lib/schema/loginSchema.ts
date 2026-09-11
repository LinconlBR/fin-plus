
// Schema Zod que valida os campos obrigatórios e os valores permitidos do login.
import { z } from "zod"

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),

}) 
