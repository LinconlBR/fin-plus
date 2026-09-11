

// Schema Zod que valida os campos obrigatórios e os valores permitidos do cadastro de usuário.

import { z } from "zod"

export const signupSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    name: z.string().min(1, "Nome é obrigatório"),
    confirm_password: z.string().min(6, "As senhas devem ser iguais e ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirm_password, {
    message: "As senhas devem ser iguais",
    path: ["confirm_password"],
})
