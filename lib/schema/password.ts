import { z } from "zod"

// Regra de senha forte compartilhada entre o cadastro e a troca de senha.
export const strongPassword = z
  .string()
  .min(6, "Senha deve ter pelo menos 6 caracteres")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial"
  )
