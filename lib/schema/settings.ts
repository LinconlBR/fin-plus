import { z } from "zod"
import { strongPassword } from "@/lib/schema/password"

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo"),
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual"),
    new_password: strongPassword,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas devem ser iguais",
    path: ["confirm_password"],
  })
  .refine((data) => data.new_password !== data.current_password, {
    message: "A nova senha deve ser diferente da atual",
    path: ["new_password"],
  })

// Palavra que a pessoa precisa digitar para liberar a exclusão da conta.
export const DELETE_CONFIRMATION = "EXCLUIR"

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION, {
    error: `Digite ${DELETE_CONFIRMATION} para confirmar`,
  }),
})
